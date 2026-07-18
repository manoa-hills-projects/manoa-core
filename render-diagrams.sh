#!/bin/bash

# Script para renderizar diagramas Mermaid a PNG
# Uso: ./render-diagrams.sh

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Renderizador de Diagramas Mermaid      ${NC}"
echo -e "${BLUE}  Manoa Core - Diagramas UML             ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Crear directorio de salida
OUTPUT_DIR="docs/diagrams-png"
mkdir -p "$OUTPUT_DIR"

echo -e "${YELLOW}📁 Directorio de salida: ${OUTPUT_DIR}${NC}"
echo ""

# Contador de diagramas
counter=1

# Función para renderizar un diagrama
render_diagram() {
    local content="$1"
    local filename="$2"
    local output_file="${OUTPUT_DIR}/${filename}.png"
    
    echo -e "${GREEN}[$counter] Renderizando: ${filename}${NC}"
    
    # Crear archivo temporal con el diagrama
    local temp_file=$(mktemp /tmp/diagram-XXXXXX.mmd)
    echo "$content" > "$temp_file"
    
    # Renderizar con mmdc
    if mmdc -i "$temp_file" -o "$output_file" -b white -w 1200 2>/dev/null; then
        echo -e "${GREEN}   ✅ Guardado: ${output_file}${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Error renderizando, intentando con opciones básicas...${NC}"
        mmdc -i "$temp_file" -o "$output_file" 2>/dev/null || echo -e "${RED}   ❌ No se pudo renderizar${NC}"
    fi
    
    # Limpiar archivo temporal
    rm -f "$temp_file"
    
    counter=$((counter + 1))
}

# ============================================
# DIAGRAMAS DE CASO DE USO
# ============================================
echo -e "${BLUE}📊 Procesando Diagramas de Caso de Uso...${NC}"
echo ""

# 1. Autenticación
render_diagram 'graph TB
    subgraph "Sistema de Autenticación"
        UC1[Iniciar Sesión]
        UC2[Cerrar Sesión]
        UC3[Recuperar Contraseña]
        UC4[Verificar Email]
        UC5[Crear Cuenta]
    end

    Ciudadano --> UC1
    Ciudadano --> UC2
    Ciudadano --> UC3
    Ciudadano --> UC5
    
    Administrador --> UC1
    Administrador --> UC2
    
    SuperAdmin[Super Admin] --> UC1
    SuperAdmin --> UC2
    
    UC1 -->|requiere| UC4
    UC5 -->|requiere| UC4
    
    style UC1 fill:#4CAF50,color:#fff
    style UC2 fill:#f44336,color:#fff
    style UC4 fill:#2196F3,color:#fff' "01-caso-uso-autenticacion"

# 2. Gestión Comunitaria
render_diagram 'graph TB
    subgraph "Gestión de Viviendas"
        UC6[Crear Vivienda]
        UC7[Editar Vivienda]
        UC8[Eliminar Vivienda]
        UC9[Listar Viviendas]
        UC10[Buscar Viviendas]
    end

    subgraph "Gestión de Familias"
        UC11[Crear Familia]
        UC12[Editar Familia]
        UC13[Eliminar Familia]
        UC14[Listar Familias]
        UC15[Buscar Familias]
    end

    subgraph "Gestión de Ciudadanos"
        UC16[Crear Ciudadano]
        UC17[Editar Ciudadano]
        UC18[Eliminar Ciudadano]
        UC19[Listar Ciudadanos]
        UC20[Buscar Ciudadanos]
        UC21[Validar Cédula]
    end

    Ciudadano --> UC9
    Ciudadano --> UC14
    Ciudadano --> UC19
    
    Administrador --> UC6
    Administrador --> UC7
    Administrador --> UC8
    Administrador --> UC9
    Administrador --> UC10
    Administrador --> UC11
    Administrador --> UC12
    Administrador --> UC13
    Administrador --> UC14
    Administrador --> UC15
    Administrador --> UC16
    Administrador --> UC17
    Administrador --> UC18
    Administrador --> UC19
    Administrador --> UC20
    Administrador --> UC21
    
    UC16 -->|usa| UC21
    UC17 -->|usa| UC21
    
    style UC6 fill:#8BC34A,color:#fff
    style UC11 fill:#8BC34A,color:#fff
    style UC16 fill:#8BC34A,color:#fff
    style UC21 fill:#FF9800,color:#fff' "02-caso-uso-gestion-comunitaria"

# 3. IA y Documentos
render_diagram 'graph TB
    subgraph "Asistente IA"
        UC22[Iniciar Conversación]
        UC23[Enviar Mensaje]
        UC24[Ver Historial]
        UC25[Eliminar Conversación]
        UC26[Consultar Datos del Sistema]
        UC27[Generar Documentos con IA]
    end

    subgraph "Chat en Tiempo Real"
        UC28[Conectar WebSocket]
        UC29[Recibir Respuesta]
        UC30[Manejar Contexto]
    end

    Ciudadano --> UC22
    Ciudadano --> UC23
    Ciudadano --> UC24
    Ciudadano --> UC25
    
    Administrador --> UC22
    Administrador --> UC23
    Administrador --> UC24
    Administrador --> UC25
    Administrador --> UC26
    Administrador --> UC27
    
    UC22 --> UC28
    UC23 --> UC30
    UC28 --> UC29
    UC30 --> UC29
    
    style UC22 fill:#9C27B0,color:#fff
    style UC27 fill:#E91E63,color:#fff
    style UC28 fill:#673AB7,color:#fff' "03-caso-uso-ia-documentos"

# 4. Documentos y Certificaciones
render_diagram 'graph TB
    subgraph "Gestión de Documentos"
        UC31[Crear Documento]
        UC32[Certificar Documento]
        UC33[Verificar Documento]
        UC34[Descargar PDF]
        UC35[Visualizar QR]
    end

    subgraph "Solicitudes de Documentos"
        UC36[Crear Solicitud]
        UC37[Revisar Solicitud]
        UC38[Aprobar Solicitud]
        UC39[Rechazar Solicitud]
        UC40[Generar Carta de Residencia]
    end

    subgraph "Certificaciones Digitales"
        UC41[Generar Hash]
        UC42[Verificar Autenticidad]
        UC43[Consultar Historial]
    end

    Ciudadano --> UC31
    Ciudadano --> UC36
    Ciudadano --> UC40
    
    Administrador --> UC31
    Administrador --> UC32
    Administrador --> UC33
    Administrador --> UC34
    Administrador --> UC35
    Administrador --> UC37
    Administrador --> UC38
    Administrador --> UC39
    Administrador --> UC43
    
    SuperAdmin --> UC41
    SuperAdmin --> UC42
    
    UC32 --> UC41
    UC33 --> UC42
    UC40 --> UC34
    
    style UC32 fill:#00BCD4,color:#fff
    style UC41 fill:#009688,color:#fff
    style UC40 fill:#03A9F4,color:#fff' "04-caso-uso-documentos"

# 5. Votaciones
render_diagram 'graph TB
    subgraph "Gestión de Asambleas"
        UC44[Crear Asamblea]
        UC45[Editar Asamblea]
        UC46[Abrir Votación]
        UC47[Cerrar Votación]
        UC48[Eliminar Asamblea]
    end

    subgraph "Sistema de Votos"
        UC49[Ver Votaciones Activas]
        UC50[Emitir Voto]
        UC51[Ver Resultados]
        UC52[Ver Mi Voto]
    end

    subgraph "Reportes de Votación"
        UC53[Generar Estadísticas]
        UC54[Exportar Resultados]
        UC55[Ver Historial]
    end

    Ciudadano --> UC49
    Ciudadano --> UC50
    Ciudadano --> UC52
    
    Administrador --> UC44
    Administrador --> UC45
    Administrador --> UC46
    Administrador --> UC47
    Administrador --> UC48
    Administrador --> UC51
    Administrador --> UC53
    Administrador --> UC54
    Administrador --> UC55
    
    UC50 -->|valida| UC49
    UC51 -->|usa| UC53
    
    style UC44 fill:#FF5722,color:#fff
    style UC50 fill:#FF9800,color:#fff
    style UC51 fill:#795548,color:#fff' "05-caso-uso-votaciones"

# 6. Tesorería
render_diagram 'graph TB
    subgraph "Gestión de Ingresos"
        UC56[Crear Pago]
        UC57[Ver Mis Pagos]
        UC58[Subir Comprobante]
        UC59[Editar Pago Rechazado]
        UC60[Descargar Comprobante]
    end

    subgraph "Gestión de Egresos"
        UC61[Crear Egreso]
        UC62[Editar Egreso]
        UC63[Eliminar Egreso]
        UC64[Listar Egresos]
    end

    subgraph "Administración Financiera"
        UC65[Gestionar Categorías]
        UC66[Gestionar Conceptos]
        UC67[Configurar Tasa de Cambio]
        UC68[Obtener Tasa BCV]
        UC69[Ver Transparencia]
    end

    subgraph "Revisión de Pagos"
        UC70[Listar Todos los Pagos]
        UC71[Aprobar Pago]
        UC72[Rechazar Pago]
        UC73[Verificar Comprobante]
    end

    Ciudadano --> UC56
    Ciudadano --> UC57
    Ciudadano --> UC58
    Ciudadano --> UC59
    Ciudadano --> UC60
    Ciudadano --> UC69
    
    Administrador --> UC61
    Administrador --> UC62
    Administrador --> UC63
    Administrador --> UC64
    Administrador --> UC65
    Administrador --> UC66
    Administrador --> UC67
    Administrador --> UC68
    Administrador --> UC70
    Administrador --> UC71
    Administrador --> UC72
    Administrador --> UC73
    
    UC56 -->|requiere| UC58
    UC71 -->|usa| UC73
    
    style UC56 fill:#4CAF50,color:#fff
    style UC61 fill:#f44336,color:#fff
    style UC68 fill:#2196F3,color:#fff' "06-caso-uso-tesoreria"

# 7. Reportes
render_diagram 'graph TB
    subgraph "Exportación de Datos"
        UC74[Exportar Ciudadanos CSV]
        UC75[Exportar Familias CSV]
        UC76[Exportar Viviendas CSV]
        UC77[Exportar Pagos CSV]
    end

    subgraph "Importación de Datos"
        UC78[Importar Ciudadanos CSV]
        UC79[Importar Familias CSV]
        UC80[Importar Viviendas CSV]
    end

    subgraph "Reportes Estadísticos"
        UC81[Ver Dashboard de Métricas]
        UC82[Ver Estadísticas por Sector]
        UC83[Ver Composición de Población]
        UC84[Ver Solicitudes por Estado]
    end

    Administrador --> UC74
    Administrador --> UC75
    Administrador --> UC76
    Administrador --> UC77
    Administrador --> UC78
    Administrador --> UC79
    Administrador --> UC80
    Administrador --> UC81
    Administrador --> UC82
    Administrador --> UC83
    Administrador --> UC84
    
    Ciudadano --> UC81
    
    style UC74 fill:#8BC34A,color:#fff
    style UC78 fill:#FF9800,color:#fff
    style UC81 fill:#00BCD4,color:#fff' "07-caso-uso-reportes"

# 8. Leyes
render_diagram 'graph TB
    subgraph "Consulta de Leyes"
        UC85[Buscar Leyes]
        UC86[Ver Detalle de Ley]
        UC87[Filtrar por Categoría]
    end

    subgraph "Actualización de Leyes"
        UC88[Solicitar Scraping]
        UC89[Ver Progreso]
        UC90[Ver Historial de Actualizaciones]
    end

    Ciudadano --> UC85
    Ciudadano --> UC86
    Ciudadano --> UC87
    
    Administrador --> UC85
    Administrador --> UC86
    Administrador --> UC87
    Administrador --> UC88
    Administrador --> UC89
    Administrador --> UC90
    
    SuperAdmin --> UC88
    
    style UC85 fill:#3F51B5,color:#fff
    style UC88 fill:#FF5722,color:#fff' "08-caso-uso-leyes"

# 9. Administración
render_diagram 'graph TB
    subgraph "Gestión de Usuarios"
        UC91[Listar Usuarios]
        UC92[Asignar Perfil]
        UC93[Ver Perfil de Usuario]
        UC94[Editar Perfil]
    end

    subgraph "Gestión de Perfiles RBAC"
        UC95[Crear Perfil]
        UC96[Editar Perfil]
        UC97[Eliminar Perfil]
        UC98[Configurar Permisos]
        UC99[Ver Permisos]
    end

    subgraph "Configuración del Consejo"
        UC100[Editar Perfil del Consejo]
        UC101[Configurar Datos Institucionales]
        UC102[Gestionar Firmantes]
        UC103[Subir Firma Digital]
    end

    subgraph "Gestión de Firmantes"
        UC104[Ver Firmantes]
        UC105[Actualizar Firmante]
        UC106[Subir Imagen de Firma]
    end

    Administrador --> UC91
    Administrador --> UC92
    Administrador --> UC93
    Administrador --> UC100
    Administrador --> UC101
    Administrador --> UC102
    Administrador --> UC103
    Administrador --> UC104
    Administrador --> UC105
    Administrador --> UC106
    
    SuperAdmin --> UC95
    SuperAdmin --> UC96
    SuperAdmin --> UC97
    SuperAdmin --> UC98
    SuperAdmin --> UC99
    
    style UC95 fill:#9C27B0,color:#fff
    style UC100 fill:#00BCD4,color:#fff
    style UC104 fill:#795548,color:#fff' "09-caso-uso-administracion"

# 10. Diagrama General
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
        S[Sistema]
    end

    subgraph "Módulos Principales"
        M1[Autenticación]
        M2[Gestión Comunitaria]
        M3[IA y Documentos]
        M4[Votaciones]
        M5[Tesorería]
        M6[Reportes]
        M7[Leyes]
        M8[Administración]
    end

    C --> M1
    C --> M2
    C --> M3
    C --> M4
    C --> M5
    C --> M7
    
    A --> M1
    A --> M2
    A --> M3
    A --> M4
    A --> M5
    A --> M6
    A --> M7
    A --> M8
    
    SA --> M1
    SA --> M2
    SA --> M3
    SA --> M4
    SA --> M5
    SA --> M6
    SA --> M7
    SA --> M8
    
    S --> M7
    S --> M3
    
    style C fill:#4CAF50,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#9C27B0,color:#fff
    style S fill:#607D8B,color:#fff' "10-caso-uso-general"

# ============================================
# DIAGRAMAS TÉCNICOS
# ============================================
echo ""
echo -e "${BLUE}📊 Procesando Diagramas Técnicos...${NC}"
echo ""

# 11. Arquitectura del Sistema
render_diagram 'graph TB
    subgraph "Capa de Presentación"
        Dashboard[Dashboard React]
        Mobile[Móvil / PWA]
    end

    subgraph "Capa de API"
        API[Hono API Server]
        Auth[Autenticación Better Auth]
        Router[Enrutador de Módulos]
    end

    subgraph "Módulos de Negocio"
        M1[Gestión Comunitaria]
        M2[Documentos y Certificaciones]
        M3[Votaciones]
        M4[Tesorería]
        M5[IA y Chat]
        M6[Reportes]
        M7[Leyes]
    end

    subgraph "Capa de Datos"
        D1[(Cloudflare D1)]
        R2[(Cloudflare R2)]
        Cache[(Cache KV)]
    end

    subgraph "Servicios Externos"
        AI[Workers AI]
        BCV[Tasa BCV API]
        Cedula[API Cédulas]
        Email[Resend Email]
    end

    subgraph "Infraestructura"
        Workers[Cloudflare Workers]
        Pages[Cloudflare Pages]
        DO[Durable Objects]
        Queue[Cloudflare Queue]
    end

    Dashboard --> API
    Mobile --> API
    
    API --> Auth
    API --> Router
    
    Router --> M1
    Router --> M2
    Router --> M3
    Router --> M4
    Router --> M5
    Router --> M6
    Router --> M7
    
    M1 --> D1
    M2 --> D1
    M2 --> R2
    M3 --> D1
    M4 --> D1
    M4 --> R2
    M5 --> AI
    M5 --> DO
    M6 --> D1
    M7 --> D1
    M7 --> Queue
    
    M4 --> BCV
    M1 --> Cedula
    Auth --> Email
    
    style Dashboard fill:#61DAFB,color:#000
    style API fill:#4CAF50,color:#fff
    style D1 fill:#F4B400,color:#000
    style R2 fill:#FF5722,color:#fff
    style AI fill:#9C27B0,color:#fff' "11-arquitectura-sistema"

# 12. Despliegue Cloudflare
render_diagram 'graph TB
    subgraph "Usuario Final"
        Browser[Navegador Web]
        App[Móvil / PWA]
    end

    subgraph "Cloudflare Pages"
        Frontend[Dashboard React]
        StaticFiles[Archivos Estáticos]
    end

    subgraph "Cloudflare Workers"
        APIWorker[API Principal]
        AuthWorker[Worker de Auth]
        ChatAgent[Chat Agent - Durable Object]
    end

    subgraph "Cloudflare D1"
        MainDB[(Base de Datos Principal)]
        AuthDB[(Base de Datos Auth)]
    end

    subgraph "Cloudflare R2"
        ReceiptsBucket[(Bucket Comprobantes)]
        DocumentsBucket[(Bucket Documentos)]
    end

    subgraph "Cloudflare KV"
        PermissionsCache[(Cache Permisos)]
        SessionCache[(Cache Sesiones)]
    end

    subgraph "Cloudflare Queue"
        LawsQueue[(Cola de Leyes)]
    end

    subgraph "Servicios Externos"
        WorkersAI[Workers AI]
        BCVAPI[API BCV]
        CedulaAPI[API Cédulas]
        ResendAPI[Resend Email]
    end

    Browser --> Frontend
    App --> Frontend
    
    Frontend --> StaticFiles
    Frontend --> APIWorker
    
    APIWorker --> AuthWorker
    APIWorker --> ChatAgent
    APIWorker --> MainDB
    APIWorker --> AuthDB
    APIWorker --> ReceiptsBucket
    APIWorker --> DocumentsBucket
    APIWorker --> PermissionsCache
    APIWorker --> SessionCache
    APIWorker --> LawsQueue
    
    ChatAgent --> MainDB
    
    LawsQueue --> APIWorker
    
    APIWorker --> WorkersAI
    APIWorker --> BCVAPI
    APIWorker --> CedulaAPI
    AuthWorker --> ResendAPI
    
    style Browser fill:#61DAFB,color:#000
    style Frontend fill:#61DAFB,color:#000
    style APIWorker fill:#4CAF50,color:#fff
    style MainDB fill:#F4B400,color:#000
    style ReceiptsBucket fill:#FF5722,color:#fff
    style WorkersAI fill:#9C27B0,color:#fff' "12-despliegue-cloudflare"

# 13. Secuencia Autenticación
render_diagram 'sequenceDiagram
    participant U as Usuario
    participant D as Dashboard
    participant API as API Hono
    participant Auth as Better Auth
    participant DB as D1 Database
    participant Email as Resend

    U->>D: Ingresa email y contraseña
    D->>API: POST /api/auth/sign-in/email
    API->>Auth: Validar credenciales
    Auth->>DB: Buscar usuario por email
    DB-->>Auth: Datos del usuario
    Auth->>Auth: Verificar contraseña
    Auth->>DB: Crear sesión
    DB-->>Auth: Sesión creada
    Auth-->>API: Token de sesión + cookies
    API-->>D: 200 OK + Set-Cookie
    D->>D: Guardar estado de autenticación
    D-->>U: Redirigir a dashboard

    Note over U,Email: Flujo de Recuperación de Contraseña

    U->>D: Solicita recuperación
    D->>API: POST /api/auth/forget-password
    API->>Auth: Generar token de recuperación
    Auth->>DB: Guardar token temporal
    Auth->>Email: Enviar email con enlace
    Email-->>U: Email de recuperación
    U->>D: Haz clic en enlace
    D->>API: POST /api/auth/reset-password
    API->>Auth: Validar token
    Auth->>DB: Actualizar contraseña
    Auth-->>API: Contraseña actualizada
    API-->>D: 200 OK
    D-->>U: Redirigir a login' "13-secuencia-autenticacion"

# 14. Secuencia Documentos
render_diagram 'sequenceDiagram
    participant C as Ciudadano
    participant D as Dashboard
    participant API as API Hono
    participant DB as D1 Database
    participant PDF as Generador PDF
    participant R2 as Cloudflare R2
    participant QR as Generador QR

    C->>D: Crea solicitud de carta de residencia
    D->>API: POST /api/requests
    API->>DB: Crear solicitud (status: pending)
    DB-->>API: Solicitud creada
    API-->>D: 201 Created
    D-->>C: Solicitud registrada

    Note over C,QR: Flujo de Aprobación (Administrador)

    C->>D: (Admin) Revisa solicitud
    D->>API: GET /api/requests/:id
    API->>DB: Obtener solicitud
    DB-->>API: Datos de solicitud
    API-->>D: Detalles completos
    D-->>C: Mostrar solicitud

    C->>D: (Admin) Aprueba solicitud
    D->>API: PATCH /api/requests/:id/review
    API->>DB: Actualizar estado a approved
    API->>PDF: Generar PDF con datos
    PDF->>PDF: Renderizar plantilla
    PDF->>QR: Generar código QR
    QR-->>PDF: QR con hash de verificación
    PDF-->>API: PDF generado
    API->>R2: Almacenar PDF
    R2-->>API: URL del documento
    API->>DB: Guardar referencia del documento
    API-->>D: 200 OK
    D-->>C: Solicitud aprobada

    Note over C,QR: Flujo de Descarga

    C->>D: Descargar documento
    D->>API: GET /api/requests/:id/document
    API->>DB: Verificar permisos
    API->>R2: Obtener PDF
    R2-->>API: Stream del PDF
    API-->>D: PDF como descarga
    D-->>C: Archivo PDF descargado' "14-secuencia-documentos"

# 15. Estados Solicitud
render_diagram 'stateDiagram-v2
    [*] --> Pendiente: Ciudadano crea solicitud
    
    Pendiente --> EnRevision: Admin revisa
    
    EnRevision --> Aprobada: Admin aprueba
    EnRevision --> Rechazada: Admin rechaza
    
    Aprobada --> DocumentoGenerado: Sistema genera PDF
    
    Rechazada --> Pendiente: Ciudadano corrige y reenvía
    
    DocumentoGenerado --> Descargada: Ciudadano descarga
    DocumentoGenerada --> Verificada: Tercero verifica QR
    
    Descargada --> [*]
    Verificada --> [*]' "15-estados-solicitud"

# 16. Estados Pago
render_diagram 'stateDiagram-v2
    [*] --> Creado: Ciudadano registra pago
    
    Creado --> PendienteRevision: Con comprobante adjunto
    
    PendienteRevision --> Aprobado: Tesorero aprueba
    PendienteRevision --> Rechazado: Tesorero rechaza
    
    Aprobado --> Conciliado: Pago registrado oficialmente
    
    Rechazado --> Correccion: Ciudadano puede corregir
    Correccion --> PendienteRevision: Reenvía comprobante
    
    Conciliado --> [*]
    Rechazado --> [*]' "16-estados-pago"

# 17. Clases/Entidades
render_diagram 'classDiagram
    class Vivienda {
        +String id
        +String direccion
        +String sector
        +String telefono
        +String tipo
        +Date createdAt
        +Date updatedAt
    }

    class Familia {
        +String id
        +String nombreFamilia
        +String houseId
        +String telefonoFijo
        +Date createdAt
        +Date updatedAt
    }

    class Ciudadano {
        +String id
        +String firstName
        +String lastName
        +String dni
        +String nacionalidad
        +String email
        +String telefono
        +Boolean isHeadOfHousehold
        +String familyId
        +Date fechaNacimiento
        +Date createdAt
        +Date updatedAt
    }

    class Solicitud {
        +String id
        +String userId
        +String tipoDocumento
        +String status
        +String descripcion
        +String documentUrl
        +Date createdAt
        +Date updatedAt
    }

    class Pago {
        +String id
        +String userId
        +String conceptId
        +String description
        +Decimal amountBs
        +Decimal amountUsd
        +String status
        +String receiptUrl
        +Date paidAt
        +Date createdAt
    }

    class Asamblea {
        +String id
        +String title
        +String description
        +String status
        +Date startDate
        +Date endDate
        +Date createdAt
    }

    class Voto {
        +String id
        +String pollId
        +String userId
        +String optionId
        +Date votedAt
    }

    class Documento {
        +String id
        +String documentType
        +String residentId
        +String hash
        +JSON metadata
        +Date createdAt
    }

    class Perfil {
        +String id
        +String name
        +String key
        +JSON permissions
        +Boolean isSystem
        +Date createdAt
    }

    class Usuario {
        +String id
        +String email
        +String name
        +String profileId
        +Date createdAt
    }

    Vivienda "1" --> "*" Familia : tiene
    Familia "1" --> "*" Ciudadano : contiene
    Ciudadano "1" --> "*" Solicitud : crea
    Ciudadano "1" --> "*" Pago : realiza
    Ciudadano "1" --> "*" Voto : emite
    Asamblea "1" --> "*" Voto : recibe
    Ciudadano "1" --> "0..1" Documento : tiene certificación
    Usuario "1" --> "0..1" Perfil : tiene asignado' "17-clases-entidades"

# 18. Componentes Frontend
render_diagram 'graph TB
    subgraph "Aplicación Principal"
        App[App.tsx]
        Router[Router Principal]
    end

    subgraph "Rutas Públicas"
        AuthRoute[/_authenticated/auth]
        VerifyRoute[/verify]
    end

    subgraph "Rutas Autenticadas"
        IndexRoute[/]
        HousesRoute[/houses]
        FamiliesRoute[/families]
        CitizensRoute[/citizens]
        PollsRoute[/polls]
        RequestsRoute[/requests]
        TreasuryRoute[/treasury]
        SettingsRoute[/settings]
        UsersRoute[/users]
        ProfilesRoute[/profiles]
        AIRoute[/ai-assistant]
    end

    subgraph "Widgets"
        HouseTable[HouseTable]
        FamilyTable[FamilyTable]
        CitizenTable[CitizenTable]
        PollCard[PollCard]
        RequestList[RequestList]
        TreasuryDashboard[TreasuryDashboard]
        StatsOverview[StatsOverview]
    end

    subgraph "Features"
        AIChat[AI Chat]
        DocumentGenerator[Document Generator]
        PaymentForm[Payment Form]
        VoteForm[Vote Form]
    end

    subgraph "Shared UI"
        DataTable[DataTable]
        SearchInput[SearchInput]
        Pagination[Pagination]
        Modal[Modal]
        ProtectedRoute[ProtectedRoute]
    end

    App --> Router
    
    Router --> AuthRoute
    Router --> VerifyRoute
    Router --> IndexRoute
    Router --> HousesRoute
    Router --> FamiliesRoute
    Router --> CitizensRoute
    Router --> PollsRoute
    Router --> RequestsRoute
    Router --> TreasuryRoute
    Router --> SettingsRoute
    Router --> UsersRoute
    Router --> ProfilesRoute
    Router --> AIRoute
    
    HousesRoute --> HouseTable
    FamiliesRoute --> FamilyTable
    CitizensRoute --> CitizenTable
    PollsRoute --> PollCard
    RequestsRoute --> RequestList
    TreasuryRoute --> TreasuryDashboard
    IndexRoute --> StatsOverview
    
    AIRoute --> AIChat
    RequestsRoute --> DocumentGenerator
    TreasuryRoute --> PaymentForm
    PollsRoute --> VoteForm
    
    HouseTable --> DataTable
    
    AuthRoute --> ProtectedRoute
    HousesRoute --> ProtectedRoute
    
    style App fill:#61DAFB,color:#000
    style Router fill:#4CAF50,color:#fff
    style ProtectedRoute fill:#FF9800,color:#fff
    style AIChat fill:#9C27B0,color:#fff' "18-componentes-frontend"

# 19. RBAC Permisos
render_diagram 'graph TB
    subgraph "Sistema de Control de Acceso"
        RBAC[RBAC Engine]
    end

    subgraph "Perfiles del Sistema"
        SuperAdmin[Super Admin]
        Admin[Administrador]
        Treasurer[Tesorero]
        Secretary[Secretario]
        Citizen[Ciudadano]
    end

    subgraph "Módulos"
        M_HOUSES[Viviendas]
        M_FAMILIES[Familias]
        M_CITIZENS[Ciudadanos]
        M_DOCUMENTS[Documentos]
        M_REQUESTS[Solicitudes]
        M_POLLS[Votaciones]
        M_TREASURY[Tesorería]
        M_PAYMENTS[Pagos]
        M_REPORTS[Reportes]
        M_LAWS[Leyes]
        M_PROFILES[Perfiles]
        M_USERS[Usuarios]
        M_SETTINGS[Configuración]
    end

    RBAC --> SuperAdmin
    RBAC --> Admin
    RBAC --> Treasurer
    RBAC --> Secretary
    RBAC --> Citizen

    SuperAdmin --> M_HOUSES
    SuperAdmin --> M_FAMILIES
    SuperAdmin --> M_CITIZENS
    SuperAdmin --> M_DOCUMENTS
    SuperAdmin --> M_REQUESTS
    SuperAdmin --> M_POLLS
    SuperAdmin --> M_TREASURY
    SuperAdmin --> M_PAYMENTS
    SuperAdmin --> M_REPORTS
    SuperAdmin --> M_LAWS
    SuperAdmin --> M_PROFILES
    SuperAdmin --> M_USERS
    SuperAdmin --> M_SETTINGS

    Admin --> M_HOUSES
    Admin --> M_FAMILIES
    Admin --> M_CITIZENS
    Admin --> M_DOCUMENTS
    Admin --> M_REQUESTS
    Admin --> M_POLLS
    Admin --> M_TREASURY
    Admin --> M_PAYMENTS
    Admin --> M_REPORTS
    Admin --> M_LAWS
    Admin --> M_SETTINGS

    Treasurer --> M_TREASURY
    Treasurer --> M_PAYMENTS

    Secretary --> M_DOCUMENTS
    Secretary --> M_REQUESTS

    Citizen --> M_REQUESTS
    Citizen --> M_POLLS
    Citizen --> M_TREASURY
    
    style RBAC fill:#607D8B,color:#fff
    style SuperAdmin fill:#F44336,color:#fff
    style Admin fill:#2196F3,color:#fff
    style Treasurer fill:#FF9800,color:#fff
    style Secretary fill:#4CAF50,color:#fff
    style Citizen fill:#9E9E9E,color:#fff' "19-rbac-permisos"

# 20. Integración Externa
render_diagram 'graph TB
    subgraph "Sistema Manoa Core"
        API[API Principal]
        Workers[Workers]
    end

    subgraph "Validación de Identidad"
        CedulaAPI[API Validación de Cédulas]
        CedulaDB[Base de Datos CEDULA]
    end

    subgraph "Información Financiera"
        BCVAPI[API Banco Central de Venezuela]
        BCVData[Tasas de Cambio]
    end

    subgraph "Inteligencia Artificial"
        WorkersAI[Cloudflare Workers AI]
        AIModels[Modelos LLM]
        AIGateway[AI Gateway]
    end

    subgraph "Comunicaciones"
        ResendAPI[Resend Email]
        SMTP[Servidor SMTP]
    end

    subgraph "Almacenamiento"
        R2Storage[Cloudflare R2]
        ReceiptsBucket[Bucket Comprobantes]
        DocumentsBucket[Bucket Documentos]
    end

    subgraph "Base de Datos"
        D1[(Cloudflare D1)]
        KVCache[(KV Cache)]
    end

    API --> CedulaAPI
    CedulaAPI --> CedulaDB
    
    API --> BCVAPI
    BCVAPI --> BCVData
    
    API --> WorkersAI
    WorkersAI --> AIModels
    WorkersAI --> AIGateway
    
    API --> ResendAPI
    ResendAPI --> SMTP
    
    API --> R2Storage
    R2Storage --> ReceiptsBucket
    R2Storage --> DocumentsBucket
    
    API --> D1
    API --> KVCache
    
    style API fill:#4CAF50,color:#fff
    style CedulaAPI fill:#00BCD4,color:#fff
    style BCVAPI fill:#FF9800,color:#fff
    style WorkersAI fill:#9C27B0,color:#fff
    style ResendAPI fill:#F44336,color:#fff
    style R2Storage fill:#FF5722,color:#fff
    style D1 fill:#F4B400,color:#000' "20-integracion-externa"

# ============================================
# DIAGRAMAS CRUD
# ============================================
echo ""
echo -e "${BLUE}📊 Procesando Diagramas CRUD...${NC}"
echo ""

# 21. CRUD Viviendas
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Operaciones CRUD"
        R[Listar Viviendas]
        C1[Crear Vivienda]
        U[Actualizar Vivienda]
        D[Eliminar Vivienda]
        S[Buscar Viviendas]
    end

    C --> R
    C --> S
    
    A --> R
    A --> C1
    A --> U
    A --> D
    A --> S
    
    SA --> R
    SA --> C1
    SA --> U
    SA --> D
    SA --> S
    
    style C fill:#9E9E9E,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style U fill:#FF9800,color:#fff
    style D fill:#f44336,color:#fff' "21-crud-viviendas"

# 22. CRUD Familias
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Operaciones CRUD"
        R[Listar Familias]
        C1[Crear Familia]
        U[Actualizar Familia]
        D[Eliminar Familia]
        S[Buscar Familias]
        V[Ver Mi Familia]
    end

    C --> R
    C --> S
    C --> V
    
    A --> R
    A --> C1
    A --> U
    A --> D
    A --> S
    
    SA --> R
    SA --> C1
    SA --> U
    SA --> D
    SA --> S
    
    style C fill:#9E9E9E,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style U fill:#FF9800,color:#fff
    style D fill:#f44336,color:#fff
    style V fill:#00BCD4,color:#fff' "22-crud-familias"

# 23. CRUD Ciudadanos
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Operaciones CRUD"
        R[Listar Ciudadanos]
        C1[Crear Ciudadano]
        U[Actualizar Ciudadano]
        D[Eliminar Ciudadano]
        S[Buscar Ciudadanos]
        V[Ver Mis Datos]
    end

    subgraph "Validaciones"
        VC[Validar Cédula V/E]
    end

    C --> R
    C --> S
    C --> V
    
    A --> R
    A --> C1
    A --> U
    A --> D
    A --> S
    
    SA --> R
    SA --> C1
    SA --> U
    SA --> D
    SA --> S
    
    C1 --> VC
    U --> VC
    
    style C fill:#9E9E9E,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style U fill:#FF9800,color:#fff
    style D fill:#f44336,color:#fff
    style VC fill:#FF5722,color:#fff' "23-crud-ciudadanos"

# 24. CRUD Solicitudes
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Operaciones"
        C1[Crear Solicitud]
        R[Listar Solicitudes]
        G[Obtener Solicitud]
        RE[Revisar]
        AP[Aprobar]
        RE2[Rechazar]
        DD[Descargar PDF]
    end

    C --> C1
    C --> R
    C --> G
    C --> DD
    
    A --> R
    A --> G
    A --> RE
    A --> AP
    A --> RE2
    A --> DD
    
    SA --> R
    SA --> G
    SA --> RE
    SA --> AP
    SA --> RE2
    SA --> DD
    
    C1 --> AP
    AP --> DD
    
    style C fill:#9E9E9E,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style AP fill:#4CAF50,color:#fff
    style RE2 fill:#f44336,color:#fff' "24-crud-solicitudes"

# 25. CRUD Tesorería
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        T[Tesorero]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Ciudadano"
        CP[Crear Pago]
        VP[Ver Mis Pagos]
    end

    subgraph "Tesorería"
        LC[Listar Categorías]
        CC[Crear Categoría]
        LP[Listar Pagos]
        RP[Revisar Pago]
        LE[Listar Egresos]
        CE[Crear Egreso]
    end

    C --> CP
    C --> VP
    
    T --> LC
    T --> CC
    T --> LP
    T --> RP
    T --> LE
    T --> CE
    
    A --> LC
    A --> CC
    A --> LP
    A --> RP
    A --> LE
    A --> CE
    
    SA --> LC
    SA --> CC
    SA --> LP
    SA --> RP
    SA --> LE
    SA --> CE
    
    style C fill:#9E9E9E,color:#fff
    style T fill:#FF9800,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style CP fill:#4CAF50,color:#fff
    style RP fill:#FF9800,color:#fff' "25-crud-tesoreria"

# 26. CRUD Votaciones
render_diagram 'graph TB
    subgraph "Actores"
        C[Ciudadano]
        A[Administrador]
        SA[Super Admin]
    end

    subgraph "Asambleas"
        C1[Crear Asamblea]
        R[Listar Asambleas]
        AO[Abrir Votación]
        AC[Cerrar Votación]
    end

    subgraph "Votos"
        VA[Ver Activas]
        EV[Emitir Voto]
        VR[Ver Resultados]
    end

    C --> R
    C --> VA
    C --> EV
    C --> VR
    
    A --> C1
    A --> R
    A --> AO
    A --> AC
    A --> VR
    
    SA --> C1
    SA --> R
    SA --> AO
    SA --> AC
    SA --> VR
    
    C1 --> AO
    AO --> AC
    VA --> EV
    
    style C fill:#9E9E9E,color:#fff
    style A fill:#2196F3,color:#fff
    style SA fill:#F44336,color:#fff
    style C1 fill:#4CAF50,color:#fff
    style EV fill:#FF9800,color:#fff
    style AO fill:#4CAF50,color:#fff
    style AC fill:#f44336,color:#fff' "26-crud-votaciones"

# 27. Permisología Completa
render_diagram 'graph TB
    subgraph "Super Admin"
        SA1[CRUD Todo]
        SA2[Gestionar Perfiles]
        SA3[Asignar Permisos]
    end

    subgraph "Administrador"
        A1[CRUD Entidades]
        A2[Aprobar Solicitudes]
        A3[Gestionar Votaciones]
    end

    subgraph "Tesorero"
        T1[CRUD Finanzas]
        T2[Revisar Pagos]
        T3[Crear Egresos]
    end

    subgraph "Secretario"
        S1[Gestionar Documentos]
        S2[Revisar Solicitudes]
    end

    subgraph "Ciudadano"
        C1[Ver Datos]
        C2[Crear Solicitudes]
        C3[Votar]
        C4[Pagar]
    end

    SA1 --> A1
    SA2 --> T1
    SA3 --> S1
    
    A1 --> T1
    A2 --> S2
    A3 --> C3
    
    T1 --> C1
    T2 --> C4
    S1 --> C2
    
    style SA1 fill:#F44336,color:#fff
    style A1 fill:#2196F3,color:#fff
    style T1 fill:#FF9800,color:#fff
    style S1 fill:#4CAF50,color:#fff
    style C1 fill:#9E9E9E,color:#fff' "27-permisiologia-completa"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ ¡Renderizado completado!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📁 Los diagramas PNG están en: ${OUTPUT_DIR}/${NC}"
echo ""

# Listar archivos generados
echo -e "${GREEN}📄 Archivos generados:${NC}"
ls -la "$OUTPUT_DIR"/*.png 2>/dev/null | wc -l
echo ""

# Mostrar tamaño total
echo -e "${YELLOW}💾 Tamaño total:${NC}"
du -sh "$OUTPUT_DIR" 2>/dev/null
echo ""
