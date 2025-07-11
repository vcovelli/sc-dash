from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from django.db.models import Sum
from files.models import UploadedFile

User = get_user_model()

# Plan quota (rows) per plan type — easy to update in one place
PLAN_ROW_QUOTAS = {
    "Free": 1000,
    "Pro": 10000,
    "Enterprise": 1000000,
}

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # User's uploads
        uploads_qs = UploadedFile.objects.filter(user=user)
        upload_count = uploads_qs.count()

        # Rows used: sum row_count of *successful* files (skip files not processed yet)
        rows_used = (
            uploads_qs.filter(status="success").aggregate(total=Sum("row_count"))["total"] or 0
        )

        # Plan, quota, and days left (trial logic here if desired)
        plan = getattr(user, "plan", "Free")
        row_quota = PLAN_ROW_QUOTAS.get(plan, PLAN_ROW_QUOTAS["Free"])
        days_left = 3 if plan == "Pro" else 0

        # User settings with defaults
        default_settings = {
            "currencyCode": "USD",
            "fontSize": "base",
            "theme": "system",
            "timezone": "America/New_York",
            "showSystemColumns": False,
        }
        user_settings = {**default_settings, **getattr(user, "settings", {})}

        # Compose response
        return Response({
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", ""),
            "business_name": getattr(user, "business_name", ""),
            "plan": plan,
            "joined": user.date_joined.strftime("%B %Y"),
            "uploads": upload_count,
            "usage": rows_used, 
            "usage_quota": row_quota, 
            "days_left": days_left,
            "settings": user_settings,
        })

    def patch(self, request):
        user = request.user
        updated = False

        business_name = request.data.get("business_name")
        plan = request.data.get("plan")
        settings = request.data.get("settings")

        if business_name and isinstance(business_name, str):
            user.business_name = business_name.strip()
            updated = True

        if plan and plan in PLAN_ROW_QUOTAS.keys():
            user.plan = plan
            updated = True
        elif plan:
            return Response({"error": "Invalid plan selected"}, status=400)

        if settings and isinstance(settings, dict):
            # Merge new settings with existing ones
            current_settings = getattr(user, "settings", {})
            current_settings.update(settings)
            user.settings = current_settings
            updated = True

        if updated:
            user.save()
            return Response({"message": "Profile updated successfully"})

        return Response({"error": "No valid fields to update"}, status=400)
