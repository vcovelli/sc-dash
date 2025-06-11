from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model
from api.models import UploadedFile

User = get_user_model()

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        upload_count = UploadedFile.objects.filter(user=user).count()

        return Response({
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "business_name": user.business_name,
            "plan": user.plan,
            "joined": user.date_joined.strftime("%B %Y"),
            "uploads": upload_count,
        })

    def patch(self, request):
        user = request.user
        updated = False

        business_name = request.data.get("business_name")
        plan = request.data.get("plan")

        if business_name and isinstance(business_name, str):
            user.business_name = business_name.strip()
            updated = True

        if plan and plan in ["Free", "Pro", "Enterprise"]:
            user.plan = plan
            updated = True
        elif plan:
            return Response({"error": "Invalid plan selected"}, status=400)

        if updated:
            user.save()
            return Response({"message": "Profile updated successfully"})

        return Response({"error": "No valid fields to update"}, status=400)
