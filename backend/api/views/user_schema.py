from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import UserSchema
from api.serializers import UserSchemaSerializer

class UserSchemaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schema = UserSchema.objects.filter(user=request.user).first()
        if not schema:
            return Response({
                "expected_headers": [],
                "grist_doc_id": None,
                "grist_doc_url": None,
                "grist_view_url": None
            }, status=200)

        # Return full schema record
        return Response({
            "expected_headers": schema.expected_headers or [],
            "grist_doc_id": schema.grist_doc_id,
            "grist_doc_url": schema.grist_doc_url,
            "grist_view_url": schema.grist_view_url
        })

    def post(self, request):
        headers = request.data.get("expected_headers")

        if not headers or not isinstance(headers, list):
            return Response({"error": "expected_headers must be a list"}, status=400)

        if len(headers) != len(set(headers)):
            return Response({"error": "expected_headers contains duplicate columns"}, status=400)

        schema, _ = UserSchema.objects.update_or_create(
            user=request.user,
            defaults={"expected_headers": headers}
        )
        return Response({"message": "Schema saved successfully"})
