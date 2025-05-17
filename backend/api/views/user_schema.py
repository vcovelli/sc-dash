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
            return Response({"expected_headers": []}, status=200)
        serializer = UserSchemaSerializer(schema)
        return Response(serializer.data)

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
