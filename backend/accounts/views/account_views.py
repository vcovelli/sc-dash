from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum
from django.contrib.auth import get_user_model
from api.models import UploadedFile
from accounts.models import UserActivity
from accounts.serializers import UserActivitySerializer

PLAN_ROW_QUOTAS = {
    "Free": 1000,
    "Pro": 10000,
    "Enterprise": 1000000,
}

User = get_user_model()

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        uploads_qs = UploadedFile.objects.filter(user=user)
        upload_count = uploads_qs.count()
        rows_used = (
            uploads_qs.filter(status="success").aggregate(total=Sum("row_count"))["total"] or 0
        )
        plan = getattr(user, "plan", "Free")
        row_quota = PLAN_ROW_QUOTAS.get(plan, PLAN_ROW_QUOTAS["Free"])
        days_left = 3 if plan == "Pro" else 0

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
        })

    def patch(self, request):
        user = request.user
        updated = False

        business_name = request.data.get("business_name")
        plan = request.data.get("plan")

        if business_name and isinstance(business_name, str):
            user.business_name = business_name.strip()
            updated = True

        if plan and plan in PLAN_ROW_QUOTAS.keys():
            user.plan = plan
            updated = True
        elif plan:
            return Response({"error": "Invalid plan selected"}, status=400)

        if updated:
            user.save()
            return Response({"message": "Profile updated successfully"})
        else:
            return Response({"error": "No valid fields to update"}, status=400)

class ActivityFeedView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        activities = UserActivity.objects.filter(user=request.user).order_by('-timestamp')[:50]
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)
