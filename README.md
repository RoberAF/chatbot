# Chatbot IA con Personalidades

Aplicación web completa que permite a los usuarios crear y personalizar múltiples alter egos (personalidades IA) para conversaciones impulsadas por OpenAI.

## 🚀 Características Principales

- **Sistema de autenticación** completo con JWT y refresh tokens
- **Múltiples personalidades** por usuario con límites según plan
- **Plantillas predefinidas** para crear personalidades rápidamente
- **Sistema de suscripción** de 3 niveles: FREE, PRO, PRO_PLUS
- **Período de prueba** automático de 2 días para nuevos usuarios
- **Chat en tiempo real** con memoria de contexto
- **Confirmación de email** y recuperación de contraseña
- **Integración con Stripe** para procesar pagos
- **Interfaz moderna** con soporte para tema claro/oscuro

## 🛠️ Stack Tecnológico

### Backend (server/backend)
```
Framework:          NestJS 11
Base de datos:      PostgreSQL + Prisma ORM
Autenticación:      JWT (passport-jwt)
IA:                OpenAI API (GPT-3.5/4)
Pagos:              Stripe
Email:              Nodemailer
Documentación:      Swagger
Seguridad:          bcrypt, class-validator
```

### Frontend (cliente)
```
Framework:          Next.js 15 + React 19
Lenguaje:          TypeScript
Estilos:           TailwindCSS 4
```

## 📁 Estructura del Proyecto

```
proyecto/
├── cliente/                    # Frontend Next.js
│   ├── src/
│   │   ├── app/               # Páginas de la aplicación
│   │   │   ├── chat/          # Página principal del chat
│   │   │   ├── login/         # Autenticación
│   │   │   ├── register/      # Registro
│   │   │   ├── personality/   # Gestión de personalidades
│   │   │   └── subscription/  # Planes y pagos
│   │   ├── components/        # Componentes reutilizables
│   │   ├── hooks/             # Custom hooks (useAuth)
│   │   └── providers/         # Context providers
│   └── public/                # Archivos estáticos
│
└── server/backend/            # Backend NestJS
    ├── src/
    │   ├── app.module.ts      # Módulo principal
    │   ├── main.ts            # Entry point
    │   ├── auth/              # Autenticación y JWT
    │   ├── chat/              # Lógica del chat
    │   ├── personality/       # CRUD de personalidades
    │   ├── subscription/      # Gestión de suscripciones
    │   ├── user/              # Perfil de usuario
    │   ├── memory/            # Sistema de memoria del chat
    │   ├── mailer/            # Servicio de emails
    │   └── prisma/            # Servicio de base de datos
    └── prisma/
        ├── schema.prisma      # Esquema de la DB
        └── migrations/        # Migraciones
```

## 🔧 Instalación

### Prerrequisitos

- Node.js v18 o superior
- PostgreSQL
- Cuenta de OpenAI con API key
- Cuenta de Stripe (para producción)
- Servicio SMTP (Mailtrap para desarrollo)

### Variables de Entorno

#### Backend (`server/backend/.env`)
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/chatbot_db"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"

# OpenAI
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-3.5-turbo"  # o gpt-4

# Stripe (opcional en desarrollo)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
MAILTRAP_API_TOKEN="tu-token-mailtrap"
MAIL_DOMAIN="tu-dominio.com"

# Frontend URL
FRONTEND_URL="http://localhost:3001"
```

#### Frontend (`cliente/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/RoberAF/chatbot
cd https://github.com/RoberAF/chatbot
```

2. **Configurar el Backend**
```bash
cd server/backend
npm install

# Crear archivo .env con las variables necesarias
cp .env.example .env

# Crear base de datos y ejecutar migraciones
npx prisma migrate deploy

# Iniciar en modo desarrollo
npm run start:dev
```

3. **Configurar el Frontend**
```bash
cd cliente
npm install

# Crear archivo .env.local
cp .env.example .env.local

# Iniciar en modo desarrollo
npm run dev
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:3001
- API: http://localhost:3000/api
- Documentación Swagger: http://localhost:3000/api/docs

## 💡 Funcionamiento

### 1. Flujo de Autenticación
1. Usuario se registra con email, contraseña, nombre y edad
2. Se crea automáticamente una suscripción PRO_PLUS de prueba (2 días)
3. Se envía email de confirmación
4. Tras confirmar, el usuario puede iniciar sesión
5. Se crea una personalidad por defecto automáticamente

### 2. Sistema de Personalidades
- **Límites por plan**:
  - FREE: 1 personalidad
  - PRO: 3 personalidades
  - PRO_PLUS: 5 personalidades
- **Plantillas disponibles**:
  - Profesionales (Asistente, Consultor)
  - Casuales (Amigo empático, Compañero ingenioso)
  - Creativas (Musa artística, Narrador)
  - Educativas (Tutor paciente, Mentor socrático)
- **Personalización**: Los usuarios pueden ajustar nombre, edad, tono, hobbies y rasgos únicos

### 3. Sistema de Chat
- Cada conversación se asocia a una personalidad activa
- El sistema mantiene memoria de conversaciones anteriores
- Las respuestas se generan según los rasgos de la personalidad
- El historial se guarda en la base de datos

### 4. Suscripciones y Pagos
- Trial automático de 2 días al registrarse (PRO_PLUS)
- Después del trial, el usuario pasa a FREE
- Integración con Stripe para upgrades
- Webhooks para actualizar estado de suscripción

## 🔒 Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- JWT con expiración de 1 hora
- Refresh tokens para renovación automática
- Validación de datos con class-validator
- Sanitización de inputs
- CORS configurado para el frontend
- Rate limiting en endpoints sensibles

## 📝 API Endpoints Principales

### Autenticación
```
POST   /api/auth/register     - Registro de usuario
POST   /api/auth/login        - Inicio de sesión
GET    /api/auth/confirm      - Confirmación de email
POST   /api/auth/refresh      - Renovar tokens
POST   /api/auth/logout       - Cerrar sesión
POST   /api/auth/forgot       - Solicitar reset de contraseña
POST   /api/auth/reset        - Resetear contraseña
```

### Usuarios
```
GET    /api/users/me          - Obtener perfil
PATCH  /api/users/me          - Actualizar perfil
```

### Personalidades
```
GET    /api/users/me/personalities           - Listar personalidades
POST   /api/users/me/personalities           - Crear personalidad
POST   /api/users/me/personalities/random    - Crear aleatoria
POST   /api/users/me/personalities/:id/select - Seleccionar activa
POST   /api/users/me/personalities/default   - Crear por defecto
```

### Chat
```
POST   /api/chat/message      - Enviar mensaje
GET    /api/chat/history/:pid - Obtener historial
```

### Suscripciones
```
GET    /api/subscription/status        - Estado actual
POST   /api/subscription/start-trial   - Iniciar trial
POST   /api/subscription/create-session - Crear sesión Stripe
POST   /api/subscription/webhook       - Webhook de Stripe
```

## 🐛 Solución de Problemas

### Base de datos
```bash
# Verificar conexión
npx prisma db pull

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset

# Ver datos en Prisma Studio
npx prisma studio
```

### Errores comunes
- **401 Unauthorized**: Token expirado o inválido
- **403 Forbidden**: Sin permisos (verificar plan)
- **429 Too Many Requests**: Límite de rate alcanzado
- **500 Server Error**: Verificar logs del backend

## 🚀 Despliegue

### Backend (Ejemplo con Railway)
1. Crear proyecto en Railway
2. Añadir PostgreSQL
3. Configurar variables de entorno
4. Conectar repositorio
5. Deploy automático

### Frontend (Ejemplo con Vercel)
1. Importar proyecto en Vercel
2. Configurar variables de entorno
3. Deploy automático


## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

Desarrollado con ❤️ por Rober