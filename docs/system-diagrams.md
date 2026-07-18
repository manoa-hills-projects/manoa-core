# Diagramas Técnicos del Sistema - Manoa Core

## Visión General

Este documento contiene los diagramas técnicos que complementan los diagramas de caso de uso. Todos los diagramas están orientados verticalmente (de arriba hacia abajo) para mejor legibilidad.

---

## 1. Diagrama de Arquitectura del Sistema

```mermaid
graph TB
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
    style AI fill:#9C27B0,color:#fff
```

**Descripción:**
- **Capa de Presentación**: Dashboard web (React) y posibles clientes móviles
- **Capa de API**: Servidor Hono con autenticación y enrutamiento
- **Módulos de Negocio**: Lógica específica de cada funcionalidad
- **Capa de Datos**: Almacenamiento en Cloudflare (D1, R2, KV)
- **Servicios Externos**: Integraciones con APIs externas
- **Infraestructura**: Servicios de Cloudflare que ejecutan el sistema

---

## 2. Diagrama de Despliegue en Cloudflare

```mermaid
graph TB
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
    style WorkersAI fill:#9C27B0,color:#fff
```

**Descripción:**
- **Cloudflare Pages**: Hosts el dashboard React y archivos estáticos
- **Cloudflare Workers**: Ejecuta la API principal y lógica de negocio
- **Durable Objects**: Maneja conexiones WebSocket para chat en tiempo real
- **D1**: Base de datos relacional para datos transaccionales
- **R2**: Almacenamiento de objetos para comprobantes y documentos
- **KV**: Cache de alta velocidad para permisos y sesiones
- **Queue**: Cola de mensajes para tareas asíncronas (scraping de leyes)

---

## 3. Diagrama de Secuencia - Flujo de Autenticación

```mermaid
sequenceDiagram
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
    D-->>U: Redirigir a login
```

**Descripción:**
1. El usuario ingresa sus credenciales en el formulario
2. El dashboard envía la petición a la API
3. Better Auth valida las credenciales contra la base de datos
4. Se crea una sesión y se devuelven cookies de autenticación
5. El dashboard almacena el estado y redirige al usuario

---

## 4. Diagrama de Secuencia - Generación de Documentos

```mermaid
sequenceDiagram
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
    D-->>C: Archivo PDF descargado
```

**Descripción:**
1. El ciudadano crea una solicitud desde el dashboard
2. El administrador revisa y aprueba la solicitud
3. El sistema genera automáticamente el PDF con los datos del ciudadano
4. Se genera un código QR para verificación futura
5. El PDF se almacena en R2 y se devuelve al usuario

---

## 5. Diagrama de Estados - Ciclo de Vida de una Solicitud

```mermaid
stateDiagram-v2
    [*] --> Pendiente: Ciudadano crea solicitud
    
    Pendiente --> EnRevision: Admin revisa
    
    EnRevision --> Aprobada: Admin aprueba
    EnRevision --> Rechazada: Admin rechaza
    
    Aprobada --> DocumentoGenerado: Sistema genera PDF
    
    Rechazada --> Pendiente: Ciudadano corrige y reenvía
    
    DocumentoGenerado --> Descargada: Ciudadano descarga
    DocumentoGenerada --> Verificada: Tercero verifica QR
    
    Descargada --> [*]
    Verificada --> [*]

    state Pendiente {
        [*] --> EsperandoRevision
        EsperandoRevision --> Notificado: Email enviado
    }

    state EnRevision {
        [*] --> AnalizandoDocumentos
        AnalizandoDocumentos --> EsperandoDecision
    }

    state Aprobada {
        [*] --> GenerandoPDF
        GenerandoPDF --> AlmacenandoEnR2
        AlmacenandoEnR2 --> Certificando
    }

    state DocumentoGenerado {
        [*] --> DisponibleParaDescarga
        DisponibleParaDescarga --> ConQRVerificacion
    }
```

**Descripción:**
- **Pendiente**: Solicitud creada, esperando revisión del administrador
- **En Revision**: Administrador está evaluando la solicitud
- **Aprobada**: Solicitud validada, sistema genera el documento
- **Rechazada**: Solicitud denegada (puede ser corregida)
- **Documento Generado**: PDF listo para descarga
- **Descargada**: Ciudadano obtuvo el documento
- **Verificada**: Tercero validó la autenticidad del documento

---

## 6. Diagrama de Estados - Ciclo de Vida de un Pago

```mermaid
stateDiagram-v2
    [*] --> Creado: Ciudadano registra pago
    
    Creado --> PendienteRevision: Con comprobante adjunto
    
    PendienteRevision --> Aprobado: Tesorero aprueba
    PendienteRevision --> Rechazado: Tesorero rechaza
    
    Aprobado --> Conciliado: Pago registrado oficialmente
    
    Rechazado --> Correccion: Ciudadano puede corregir
    Correccion --> PendienteRevision: Reenvía comprobante
    
    Conciliado --> [*]
    Rechazado --> [*]

    state Creado {
        [*] --> ValidandoDatos
        ValidandoDatos --> SubiendoComprobante
        SubiendoComprobante --> GuardadoEnR2
    }

    state PendienteRevision {
        [*] --> EnColaEspera
        EnColaEspera --> AsignadoATesorero
        AsignadoATesorero --> RevisandoComprobante
    }

    state Aprobado {
        [*] --> VerificandoMonto
        VerificandoMonto --> RegistrandoEnLibros
        RegistrandoEnLibros --> GenerandoRecibo
    }

    state Rechazado {
        [*] --> ConObservaciones
        ConObservaciones --> NotificadoACiudadano
    }
```

**Descripción:**
- **Creado**: Ciudadano registra el pago con comprobante
- **Pendiente Revision**: Esperando que el tesorero revise
- **Aprobado**: Pago validado y registrado
- **Rechazado**: Pago denegado con observaciones
- **Conciliado**: Pago integrado oficialmente en contabilidad

---

## 7. Diagrama de Clases/Entidades del Dominio

```mermaid
classDiagram
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

    class ConceptoPago {
        +String id
        +String name
        +String description
        +Boolean isActive
        +Date createdAt
    }

    class CategoriaEgreso {
        +String id
        +String name
        +String description
        +Date createdAt
    }

    class Egreso {
        +String id
        +String categoryId
        +String description
        +String beneficiary
        +Decimal amountBs
        +Decimal amountUsd
        +Date spentAt
        +String receiptUrl
        +String registeredBy
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

    class Ley {
        +String id
        +String titulo
        +String contenido
        +String categoria
        +Date fechaPublicacion
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
    Pago "*" --> "1" ConceptoPago : corresponde a
    Egreso "*" --> "1" CategoriaEgreso : pertenece a
    Asamblea "1" --> "*" Voto : recibe
    Ciudadano "1" --> "0..1" Documento : tiene certificación
    Usuario "1" --> "0..1" Perfil : tiene asignado
```

**Descripción:**
- **Vivienda**: Representa una casa o apartamento en la comunidad
- **Familia**: Unidad familiar que habita una vivienda
- **Ciudadano**: Persona miembro de una familia
- **Solicitud**: Petición de documento legal
- **Pago**: Registro de pago realizado por un ciudadano
- **ConceptoPago**: Tipo de pago (cuota, multa, etc.)
- **CategoriaEgreso**: Categoría de gasto
- **Egreso**: Registro de gasto del consejo comunal
- **Asamblea**: Votación comunitaria
- **Voto**: Voto emitido por un ciudadano
- **Documento**: Certificación digital de un documento
- **Ley**: Legislación venezolana
- **Perfil**: Rol del usuario en el sistema
- **Usuario**: Cuenta de usuario del sistema

---

## 8. Diagrama de Componentes - Frontend (Dashboard)

```mermaid
graph TB
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
        ValidationsRoute[/validations]
        LawsRoute[/laws]
        TreasuryRoute[/treasury]
        SettingsRoute[/settings]
        UsersRoute[/users]
        ProfilesRoute[/profiles]
        AIRoute[/ai-assistant]
        MeetingsRoute[/meetings]
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
        CSVImport[CSV Import]
        CSVExport[CSV Export]
    end

    subgraph "Shared UI"
        DataTable[DataTable]
        SearchInput[SearchInput]
        Pagination[Pagination]
        Modal[Modal]
        Toast[Toast]
        ProtectedRoute[ProtectedRoute]
    end

    subgraph "Hooks"
        UseAuth[useAuth]
        UseQuery[useQuery]
        UseMutation[useMutation]
        UseMobile[useMobile]
    end

    subgraph "Lib"
        AuthClient[authClient]
        APIClient[apiClient]
        Utils[utils]
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
    Router --> ValidationsRoute
    Router --> LawsRoute
    Router --> TreasuryRoute
    Router --> SettingsRoute
    Router --> UsersRoute
    Router --> ProfilesRoute
    Router --> AIRoute
    Router --> MeetingsRoute
    
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
    HousesRoute --> CSVImport
    HousesRoute --> CSVExport
    
    HouseTable --> DataTable
    FamilyTable --> DataTable
    CitizenTable --> DataTable
    SearchInput --> DataTable
    Pagination --> DataTable
    
    AuthRoute --> ProtectedRoute
    HousesRoute --> ProtectedRoute
    
    UseAuth --> AuthClient
    UseQuery --> APIClient
    UseMutation --> APIClient
    
    style App fill:#61DAFB,color:#000
    style Router fill:#4CAF50,color:#fff
    style ProtectedRoute fill:#FF9800,color:#fff
    style AIChat fill:#9C27B0,color:#fff
```

**Descripción:**
- **Aplicación Principal**: Punto de entrada y enrutador
- **Rutas Públicas**: Páginas accesibles sin autenticación
- **Rutas Autenticadas**: Páginas que requieren sesión activa
- **Widgets**: Componentes reutilizables de UI
- **Features**: Funcionalidades completas del negocio
- **Shared UI**: Componentes base de interfaz
- **Hooks**: Lógica reutilizable de React
- **Lib**: Utilidades y clientes de API

---

## 9. Diagrama de Permisos RBAC

```mermaid
graph TB
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

    subgraph "Acciones"
        A_READ[Lectura]
        A_CREATE[Crear]
        A_UPDATE[Actualizar]
        A_DELETE[Eliminar]
        A_MANAGE[Gestionar]
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

    M_HOUSES --> A_READ
    M_HOUSES --> A_CREATE
    M_HOUSES --> A_UPDATE
    M_HOUSES --> A_DELETE

    M_PROFILES --> A_MANAGE
    M_USERS --> A_MANAGE

    style RBAC fill:#607D8B,color:#fff
    style SuperAdmin fill:#F44336,color:#fff
    style Admin fill:#2196F3,color:#fff
    style Treasurer fill:#FF9800,color:#fff
    style Secretary fill:#4CAF50,color:#fff
    style Citizen fill:#9E9E9E,color:#fff
```

**Descripción:**
- **Super Admin**: Acceso total a todos los módulos y configuración
- **Administrador**: Acceso a la mayoría de módulos excepto RBAC
- **Tesorero**: Acceso enfocado a tesorería y pagos
- **Secretario**: Acceso a documentos y solicitudes
- **Ciudadano**: Acceso limitado a sus propias solicitudes y votaciones

---

## 10. Diagrama de Integración Externa

```mermaid
graph TB
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

    subgraph "Colas de Mensajes"
        Queue[Cloudflare Queue]
        LawsWorker[Worker de Leyes]
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
    
    Queue --> LawsWorker
    LawsWorker --> API

    style API fill:#4CAF50,color:#fff
    style CedulaAPI fill:#00BCD4,color:#fff
    style BCVAPI fill:#FF9800,color:#fff
    style WorkersAI fill:#9C27B0,color:#fff
    style ResendAPI fill:#F44336,color:#fff
    style R2Storage fill:#FF5722,color:#fff
    style D1 fill:#F4B400,color:#000
```

**Descripción:**
- **API de Cédulas**: Validación de cédulas venezolanas contra base de datos oficial
- **API BCV**: Obtención de tasas de cambio oficiales
- **Workers AI**: Procesamiento de lenguaje natural para el chat y generación de documentos
- **Resend**: Envío de emails transaccionales
- **R2**: Almacenamiento persistente de archivos
- **D1**: Base de datos relacional principal
- **Queue**: Procesamiento asíncrono de tareas pesadas

---

## Resumen de Diagramas

| Diagrama | Propósito | Audiencia |
|----------|-----------|-----------|
| **Arquitectura** | Visión general del sistema | Desarrolladores, Arquitectos |
| **Despliegue** | Infraestructura en Cloudflare | DevOps, Desarrolladores |
| **Secuencia Auth** | Flujo de autenticación | Desarrolladores, QA |
| **Secuencia Documentos** | Generación de documentos | Desarrolladores, Negocio |
| **Estados Solicitud** | Ciclo de vida de solicitudes | Negocio, Usuarios |
| **Estados Pago** | Ciclo de vida de pagos | Negocio, Tesoreros |
| **Clases/Entidades** | Modelo de datos | Desarrolladores, DBAs |
| **Componentes Front** | Estructura del dashboard | Frontend Developers |
| **RBAC** | Sistema de permisos | Administradores, Seguridad |
| **Integración** | Conexiones externas | Desarrolladores, DevOps |

---

## Cómo Usar Estos Diagramas

### Para Documentación Técnica
- Incluye en `README.md` del repositorio
- Agrega a la wiki del proyecto
- Usa en documentación de arquitectura

### Para Presentaciones
- Exporta como PNG desde Mermaid Live Editor
- Inserta en diapositivas
- Úsalos para explicar el sistema a stakeholders

### Para Desarrollo
- Referencia durante el desarrollo
- Usa para onboardar nuevos desarrolladores
- Actualiza cuando cambie la arquitectura

---

*Documento generado automáticamente basado en la estructura del código fuente de Manoa Core.*
*Última actualización: Julio 2026*
