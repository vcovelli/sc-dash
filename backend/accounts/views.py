from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from .serializers import SignupSerializer
from api.models import UploadedFile

User = get_user_model()

# Signup API
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        plan = request.data.get("plan", "Free")  # default to Free if missing
        request.data["plan"] = plan  # inject into serializer

        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.plan = plan
            user.save(update_fields=["plan"])
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Login API
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = User.objects.filter(username=username).first()

        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# Profile API
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
        else:
            return Response({"error": "No valid fields to update"}, status=400)
