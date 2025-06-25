from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import status
from .serializers import SignupSerializer
from api.models import UploadedFile
from allauth.account.views import ConfirmEmailView
from django.shortcuts import redirect
from django.http import Http404
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC, EmailAddress

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from django.db.models import Sum

from allauth.socialaccount.providers.github.views import GitHubOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.views import View
from allauth.socialaccount.models import SocialLogin
import requests
from allauth.socialaccount.helpers import complete_social_login
from .models import UserActivity
from .serializers import UserActivitySerializer

class ActivityFeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get the 50 most recent activities for this user
        activities = UserActivity.objects.filter(user=request.user).order_by('-timestamp')[:50]
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)

User = get_user_model()

# Manual Google OAuth handler that returns JWTs
class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"detail": "Missing Google token"}, status=400)

        try:
            # Verify token with Google's public key
            id_info = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                os.getenv("GOOGLE_CLIENT_ID")
            )

            email = id_info["email"]
            name = id_info.get("name", "")
            picture = id_info.get("picture", "")

            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": email, "first_name": name}
            )

            # Ensure email is verified in allauth
            EmailAddress.objects.get_or_create(
                user=user,
                email=email,
                defaults={"verified": True, "primary": True}
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            return Response({
                "access": access_token,
                "refresh": str(refresh),
                "new": created,
                "user": {
                    "email": user.email,
                    "name": user.first_name,
                    "picture": picture,
                    "plan": user.plan,
                    "joined": user.date_joined.strftime("%B %Y"),
                }
            })

        except ValueError:
            return Response({"detail": "Invalid ID token"}, status=400)
        except Exception as e:
            return Response({"detail": f"Login failed: {str(e)}"}, status=500)

# GitHub OAuth flow: start and callback
class GitHubLoginStartView(View):
    def get(self, request):
        client_id = settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id']
        intent = request.GET.get("intent", "login")
        redirect_uri = f"https://supplywise.ai/auth/github/callback/?intent={intent}"

        force_reauth = intent == "signup"  # or: request.GET.get("reauth") == "true"

        auth_url = (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope=user:email"
            f"&allow_signup=true"
        )

        if force_reauth:
            # There's no official way to force re-login, but:
            # This disables GitHub's silent cookie-based redirect
            auth_url += "&login="

        return redirect(auth_url)

class GitHubCallbackView(View):
    def get(self, request):
        code = request.GET.get("code")
        if not code:
            return redirect("/login?error=missing_code")

        client_id = settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["client_id"]
        client_secret = settings.SOCIALACCOUNT_PROVIDERS["github"]["APP"]["secret"]

        # Exchange code for access token
        token_res = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
            },
        )

        token_json = token_res.json()
        access_token = token_json.get("access_token")

        if not access_token:
            return redirect("/login?error=token_exchange_failed")

        # Use token to get user info
        user_res = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )

        user_info = user_res.json()
        email = user_info.get("email")

        # GitHub may not return email — fetch it separately
        if not email:
            emails_res = requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}"},
            )
            emails_data = emails_res.json()
            primary_emails = [e["email"] for e in emails_data if e.get("primary")]
            email = primary_emails[0] if primary_emails else None

        if not email:
            return redirect("/login?error=no_email")

        # Create or fetch user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email.split("@")[0],
                "first_name": user_info.get("name") or email.split("@")[0],
            }
        )

        # Issue JWTs
        refresh = RefreshToken.for_user(user)

        intent = request.GET.get("intent", "login")

        return redirect(
            f"https://supplywise.ai/login?access={refresh.access_token}&refresh={refresh}&intent={intent}"
        )
    
class GitHubFinishLoginView(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        # This assumes your frontend posts the access_token it got from GitHub
        return super().post(request, *args, **kwargs)
    
class GitHubLogin(SocialLoginView):
    adapter_class = GitHubOAuth2Adapter

# Optional: email verification redirect handler
class ReactConfirmEmailView(ConfirmEmailView):
    def get(self, request, key, *args, **kwargs):
        try:
            confirmation = EmailConfirmationHMAC.from_key(key)
        except Exception:
            confirmation = None
        if not confirmation:
            try:
                confirmation = EmailConfirmation.objects.get(key=key.lower())
            except EmailConfirmation.DoesNotExist:
                raise Http404("Invalid confirmation key")
        if confirmation.email_address.verified:
            return redirect("https://supplywise.ai/login?verified=1")
        confirmation.confirm(request)
        return redirect("https://supplywise.ai/login?verified=1")

# Signup API
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        plan = request.data.get("plan", "Free")
        request.data["plan"] = plan
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.plan = plan
            user.save(update_fields=["plan"])
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Username/Password Login API
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if user:
            try:
                email_address = EmailAddress.objects.get(user=user, email=user.email)
                if not email_address.verified:
                    return Response({"error": "Please verify your email address before logging in."}, status=403)
            except EmailAddress.DoesNotExist:
                return Response({"error": "No email address found. Please contact support."}, status=403)

            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        return Response({"error": "Invalid credentials"}, status=401)

# Plan quota (rows) per plan type — update as needed
PLAN_ROW_QUOTAS = {
    "Free": 1000,
    "Pro": 10000,
    "Enterprise": 1000000,
}

# User Profile API
class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        uploads_qs = UploadedFile.objects.filter(user=user)
        upload_count = uploads_qs.count()

        # Sum only "successful" rows for usage (matches dashboard)
        rows_used = (
            uploads_qs.filter(status="success").aggregate(total=Sum("row_count"))["total"] or 0
        )

        plan = getattr(user, "plan", "Free")
        row_quota = PLAN_ROW_QUOTAS.get(plan, PLAN_ROW_QUOTAS["Free"])
        # Calculate days_left logic as needed (sample logic here)
        days_left = 3 if plan == "Pro" else 0

        return Response({
            "username": user.username,
            "email": user.email,
            "role": getattr(user, "role", ""),
            "business_name": getattr(user, "business_name", ""),
            "plan": plan,
            "joined": user.date_joined.strftime("%B %Y"),
            "uploads": upload_count,
            "usage": rows_used,           # <-- needed for usage bar
            "usage_quota": row_quota,     # <-- needed for usage bar
            "days_left": days_left,       # <-- needed for usage bar
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
