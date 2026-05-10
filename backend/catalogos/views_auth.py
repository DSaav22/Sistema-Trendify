import jwt
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import (
    CustomJWTAuthentication,
    blacklist_token_by_payload,
    decode_jwt_token,
    generate_token_pair,
)
from .models import Usuario, Rol, Cliente


class RegistroClienteSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=60)
    password = serializers.CharField(write_only=True, min_length=6)
    nombre_completo = serializers.CharField(max_length=150)
    telefono = serializers.CharField(max_length=25, required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=60)
    password = serializers.CharField(write_only=True)


class LogoutSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo = serializers.CharField(write_only=True, min_length=8)


class RegistroClienteView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroClienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password']
        nombre_completo = serializer.validated_data['nombre_completo'].strip()
        telefono = serializer.validated_data.get('telefono', '').strip()
        ciudad = serializer.validated_data.get('ciudad', '').strip()
        direccion = serializer.validated_data.get('direccion', '').strip()

        if Usuario.objects.filter(username=username).exists():
            return Response({'detail': 'El nombre de usuario (email) ya esta en uso.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar el Rol de Cliente (id_rol = 6)
        rol_cliente = Rol.objects.filter(id_rol=6).first()
        if not rol_cliente:
            rol_cliente = Rol.objects.create(id_rol=6, nombre_rol='Cliente', descripcion='Cliente final que compra en la tienda online.')

        from django.db import transaction
        with transaction.atomic():
            usuario = Usuario.objects.create(
                id_rol=rol_cliente,
                nombre_completo=nombre_completo,
                username=username,
                password_hash=make_password(password),
                estado='activo'
            )

            cliente = Cliente.objects.create(
                nombre_completo=nombre_completo,
                telefono=telefono,
                ciudad=ciudad,
                direccion=direccion,
                id_usuario_fk=usuario,
                es_top=False,
                estado='activo'
            )

        tokens = generate_token_pair(usuario)
        return Response(
            {
                'message': 'Registro exitoso.',
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'id_usuario': usuario.id_usuario,
                'username': usuario.username,
                'id_rol': usuario.id_rol_id,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password']

        usuario = Usuario.objects.filter(username=username).select_related('id_rol').first()
        if usuario is None:
            return Response({'detail': 'Credenciales invalidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        if (usuario.estado or '').lower() != 'activo':
            return Response({'detail': 'Usuario inactivo.'}, status=status.HTTP_403_FORBIDDEN)

        if not check_password(password, usuario.password_hash):
            return Response({'detail': 'Credenciales invalidas.'}, status=status.HTTP_401_UNAUTHORIZED)

        tokens = generate_token_pair(usuario)
        return Response(
            {
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token'],
                'id_usuario': usuario.id_usuario,
                'username': usuario.username,
                'id_rol': usuario.id_rol_id,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        refresh_token = serializer.validated_data['refresh_token']

        try:
            payload = decode_jwt_token(refresh_token, verify_exp=False)
        except jwt.InvalidTokenError:
            return Response({'detail': 'Refresh token invalido.'}, status=status.HTTP_400_BAD_REQUEST)

        if payload.get('token_type') != 'refresh':
            return Response({'detail': 'Se esperaba un refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        blacklist_token_by_payload(payload)
        return Response({'detail': 'Sesion cerrada correctamente.'}, status=status.HTTP_200_OK)


class CambiarPasswordView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = request.user
        password_actual = serializer.validated_data['password_actual']
        password_nuevo = serializer.validated_data['password_nuevo']

        if not isinstance(usuario, Usuario):
            return Response({'detail': 'Usuario autenticado invalido.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password_actual, usuario.password_hash):
            return Response({'detail': 'La password_actual es incorrecta.'}, status=status.HTTP_400_BAD_REQUEST)

        if password_actual == password_nuevo:
            return Response(
                {'detail': 'La nueva contrasena no puede ser igual a la actual.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.password_hash = make_password(password_nuevo)
        usuario.save(update_fields=['password_hash'])

        return Response({'detail': 'Contrasena actualizada correctamente.'}, status=status.HTTP_200_OK)
