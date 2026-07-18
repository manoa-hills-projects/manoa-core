#!/bin/bash

# Diagramas de flujo por endpoint - Formato simple
set -e

OUTPUT="/home/armando/Escritorio/proyectos/manoa-core/docs/diagrams-png"
mkdir -p "$OUTPUT"

render() {
    local content="$1"
    local name="$2"
    echo "📝 $name"
    echo "$content" > /tmp/flow.mmd
    mmdc -i /tmp/flow.mmd -o "${OUTPUT}/${name}.png" -b white 2>/dev/null
}

echo "🚀 Creando diagramas por endpoint..."
echo ""

# ============================================
# HOUSES
# ============================================
echo "📁 HOUSES"

render 'flowchart TB
    A[Start] --> B[Receive request]
    B --> C{Is authenticated?}
    C -->|No| D[Return 401]
    C -->|Yes| E{Is GET?}
    E -->|Yes| F[Query DB]
    F --> G[Return list]
    E -->|No| H{Is POST?}
    H -->|Yes| I[Validate body]
    I --> J{House exists?}
    J -->|Yes| K[Return 409]
    J -->|No| L[Insert into DB]
    L --> M[Return 201]
    H -->|No| N{Is PATCH?}
    N -->|Yes| O[Validate body]
    O --> P[Update DB]
    P --> Q[Return updated]
    N -->|No| R{Is DELETE?}
    R -->|Yes| S[Check relations]
    S --> T{Has families?}
    T -->|Yes| U[Return 409]
    T -->|No| V[Delete from DB]
    V --> W[Return 204]' "01-houses"

# GET houses
render 'flowchart TB
    A[GET /api/houses] --> B[Check auth]
    B --> C[Query houses from DB]
    C --> D[Apply filters if any]
    D --> E[Apply pagination]
    E --> F[Return JSON list]' "02-houses-get"

# POST house
render 'flowchart TB
    A[POST /api/houses] --> B[Check auth]
    B --> C[Validate body: address, sector]
    C --> D{Address already exists?}
    D -->|Yes| E[Return 409 Conflict]
    D -->|No| F[Insert into DB]
    F --> G[Return 201 Created]' "03-houses-post"

# PATCH house
render 'flowchart TB
    A[PATCH /api/houses/:id] --> B[Check auth]
    B --> C[Find house by ID]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F[Validate body]
    F --> G[Update fields in DB]
    G --> H[Return updated house]' "04-houses-patch"

# DELETE house
render 'flowchart TB
    A[DELETE /api/houses/:id] --> B[Check auth]
    B --> C[Find house by ID]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F{Has families?}
    F -->|Yes| G[Return 409 - has families]
    F -->|No| H[Delete from DB]
    H --> I[Return 204]' "05-houses-delete"

# ============================================
# FAMILIES
# ============================================
echo "📁 FAMILIES"

# POST family
render 'flowchart TB
    A[POST /api/families] --> B[Check auth]
    B --> C[Validate body]
    C --> D[Check houseId exists]
    D --> E{House found?}
    E -->|No| F[Return 404]
    E -->|Yes| G[Insert family]
    G --> H[Return 201]' "06-families-post"

# GET families
render 'flowchart TB
    A[GET /api/families] --> B[Check auth]
    B --> C[Query families with house]
    C --> D[Return list]' "07-families-get"

# PATCH family
render 'flowchart TB
    A[PATCH /api/families/:id] --> B[Check auth]
    B --> C[Find family]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F[Validate body]
    F --> G[Update family]
    G --> H[Return updated]' "08-families-patch"

# DELETE family
render 'flowchart TB
    A[DELETE /api/families/:id] --> B[Check auth]
    B --> C[Find family]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F{Has citizens?}
    F -->|Yes| G[Return 409]
    F -->|No| H[Delete]
    H --> I[Return 204]' "09-families-delete"

# ============================================
# CITIZENS
# ============================================
echo "📁 CITIZENS"

# POST citizen
render 'flowchart TB
    A[POST /api/citizens] --> B[Check auth]
    B --> C[Validate body]
    C --> D[Validate cedula externally]
    D --> E{Valid cedula?}
    E -->|No| F[Return 400]
    E -->|Yes| G{DNI already exists?}
    G -->|Yes| H[Return 409]
    G -->|No| I[Check familyId]
    I --> J[Insert citizen]
    J --> K[Return 201]' "10-citizens-post"

# GET citizens
render 'flowchart TB
    A[GET /api/citizens] --> B[Check auth]
    B --> C[Query citizens with family]
    C --> D[Apply filters/search]
    D --> E[Return list]' "11-citizens-get"

# PATCH citizen
render 'flowchart TB
    A[PATCH /api/citizens/:id] --> B[Check auth]
    B --> C[Find citizen]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F[Validate body]
    F --> G{DNI changed?}
    G -->|Yes| H[Check new DNI unique]
    G -->|No| I[Update fields]
    H --> I
    I --> J[Return updated]' "12-citizens-patch"

# DELETE citizen
render 'flowchart TB
    A[DELETE /api/citizens/:id] --> B[Check auth]
    B --> C[Find citizen]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F{Is head of household?}
    F -->|Yes| G[Return 409 - is head]
    F -->|No| H[Delete]
    H --> I[Return 204]' "13-citizens-delete"

# ============================================
# REQUESTS
# ============================================
echo "📁 REQUESTS"

# POST request
render 'flowchart TB
    A[POST /api/requests] --> B[Check auth]
    B --> C[Get userId from session]
    C --> D[Validate body]
    D --> E[Create request with status pending]
    E --> F[Return 201]' "14-requests-post"

# GET requests
render 'flowchart TB
    A[GET /api/requests] --> B[Check auth]
    B --> C{Is admin?}
    C -->|Yes| D[Query all requests]
    C -->|No| E[Query user requests only]
    D --> F[Apply pagination]
    E --> F
    F --> G[Return list]' "15-requests-get"

# PATCH review request
render 'flowchart TB
    A[PATCH /api/requests/:id/review] --> B[Check auth]
    B --> C[Find request]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F[Validate status change]
    F --> G{Approve?}
    G -->|Yes| H[Set status approved]
    H --> I[Generate PDF document]
    I --> J[Store in R2]
    J --> K[Update request]
    G -->|No| L[Set status rejected]
    L --> M[Add rejection reason]
    M --> K
    K --> N[Return updated]' "16-requests-patch"

# GET download document
render 'flowchart TB
    A[GET /api/requests/:id/document] --> B[Check auth]
    B --> C[Find request]
    C --> D{Is owner or admin?}
    D -->|No| E[Return 403]
    D -->|Yes| F{Is approved?}
    F -->|No| G[Return 400]
    F -->|Yes| H[Get PDF from R2]
    H --> I[Return PDF stream]' "17-requests-document"

# ============================================
# TREASURY
# ============================================
echo "📁 TREASURY"

# POST payment
render 'flowchart TB
    A[POST /api/treasury/payments] --> B[Check auth]
    B --> C[Get userId from session]
    C --> D[Parse multipart form]
    D --> E{Receipt attached?}
    E -->|No| F[Return 400]
    E -->|Yes| G[Validate amounts]
    G --> H[Upload receipt to R2]
    H --> I[Insert payment]
    I --> J[Return 201]' "18-treasury-payment-post"

# GET my payments
render 'flowchart TB
    A[GET /api/treasury/payments/mine] --> B[Check auth]
    B --> C[Get userId]
    C --> D[Query user payments]
    D --> E[Return list]' "19-treasury-payment-mine"

# POST review payment
render 'flowchart TB
    A[POST /api/treasury/payments/:id/review] --> B[Check auth]
    B --> C[Find payment]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F{Action: approve?}
    F -->|Yes| G[Set status approved]
    F -->|No| H[Set status rejected]
    H --> I[Add rejection reason]
    G --> J[Update payment]
    I --> J
    J --> K[Return updated]' "20-treasury-payment-review"

# POST expense
render 'flowchart TB
    A[POST /api/treasury/expenses] --> B[Check auth]
    B --> C[Parse multipart]
    C --> D[Validate amounts]
    D --> E[Upload receipt if any]
    E --> F[Insert expense]
    F --> G[Return 201]' "21-treasury-expense-post"

# POST fetch BCV rate
render 'flowchart TB
    A[POST /api/treasury/rates/fetch-bcv] --> B[Check auth]
    B --> C[Fetch from BCV API]
    C --> D{Success?}
    D -->|No| E[Return 502]
    D -->|Yes| F[Parse rate]
    F --> G[Save to DB]
    G --> H[Return rate]' "22-treasury-bcv"

# ============================================
# POLLS
# ============================================
echo "📁 POLLS"

# POST poll
render 'flowchart TB
    A[POST /api/polls] --> B[Check auth]
    B --> C[Validate body]
    C --> D[Create poll with status draft]
    D --> E[Return 201]' "23-polls-post"

# GET polls
render 'flowchart TB
    A[GET /api/polls] --> B[Check auth]
    B --> C[Query polls]
    C --> D[Apply status filter]
    D --> E[Return list]' "24-polls-get"

# PATCH status
render 'flowchart TB
    A[PATCH /api/polls/:id/status] --> B[Check auth]
    B -->|No| C[Return 401]
    B -->|Yes| D[Find poll]
    D --> E{Found?}
    E -->|No| F[Return 404]
    E -->|Yes| G{New status valid?}
    G -->|No| H[Return 400]
    G -->|Yes| I[Update status]
    I --> J[Return updated]' "25-polls-status"

# POST vote
render 'flowchart TB
    A[POST /api/polls/:id/vote] --> B[Check auth]
    B --> C[Get userId]
    C --> D[Find poll]
    D --> E{Poll is open?}
    E -->|No| F[Return 400]
    E -->|Yes| G{Already voted?}
    G -->|Yes| H[Return 409]
    G -->|No| I[Insert vote]
    I --> J[Return 201]' "26-polls-vote"

# ============================================
# DOCUMENTS
# ============================================
echo "📁 DOCUMENTS"

# POST certify
render 'flowchart TB
    A[POST /api/documents] --> B[Check auth]
    B --> C[Validate body]
    C --> D[Generate SHA256 hash]
    D --> E[Store certification]
    E --> F[Return hash]' "27-documents-post"

# GET verify
render 'flowchart TB
    A[GET /api/documents/verify/:id] --> B[Query certification]
    B --> C{Found?}
    C -->|No| D[Return invalid]
    C -->|Yes| E[Return valid + details]' "28-documents-verify"

# ============================================
# CERTIFICATIONS
# ============================================
echo "📁 CERTIFICATIONS"

# POST generate
render 'flowchart TB
    A[POST /api/certifications/generar] --> B[Check resident exists]
    B --> C{Found?}
    C -->|No| D[Return 404]
    C -->|Yes| E[Generate SHA256 hash]
    E --> F[Store certification]
    F --> G[Return hash]' "29-certifications-post"

# GET verify by hash
render 'flowchart TB
    A[GET /api/certifications/verificar/:hash] --> B[Query by hash]
    B --> C{Found?}
    C -->|No| D[Return 404]
    C -->|Yes| E[Return valid + resident info]' "30-certifications-get"

# ============================================
# PROFILES
# ============================================
echo "📁 PROFILES"

# GET profiles
render 'flowchart TB
    A[GET /api/profiles] --> B[Check auth]
    B --> C[Query all profiles]
    C --> D[Return list]' "31-profiles-get"

# POST profile
render 'flowchart TB
    A[POST /api/profiles] --> B[Check auth]
    B --> C[Validate body]
    C --> D{Key already exists?}
    D -->|Yes| E[Return 409]
    D -->|No| F[Create profile]
    F --> G[Return 201]' "32-profiles-post"

# PUT permissions
render 'flowchart TB
    A[PUT /api/profiles/:id/permissions] --> B[Check auth]
    B --> C[Find profile]
    C --> D{Found?}
    D -->|No| E[Return 404]
    D -->|Yes| F[Validate permissions]
    F --> G[Update permissions]
    G --> H[Clear cache]
    H --> I[Return updated]' "33-profiles-permissions"

# ============================================
# STATS
# ============================================
echo "📁 STATS"

render 'flowchart TB
    A[GET /api/stats/overview] --> B[Check auth]
    B --> C[Count houses]
    C --> D[Count families]
    D --> E[Count citizens]
    E --> F[Group by sector]
    F --> G[Count requests by status]
    G --> H[Count polls by status]
    H --> I[Return overview]' "34-stats-overview"

# ============================================
# LAWS
# ============================================
echo "📁 LAWS"

# GET laws
render 'flowchart TB
    A[GET /api/laws] --> B[Query laws]
    B --> C[Apply filters]
    C --> D[Return list]' "35-laws-get"

# POST scrape
render 'flowchart TB
    A[POST /api/laws/scrape] --> B[Check auth]
    B --> C[Add to queue]
    C --> D[Return 202]' "36-laws-scrape"

# ============================================
# SIGNATORIES
# ============================================
echo "📁 SIGNATORIES"

# GET signatories
render 'flowchart TB
    A[GET /api/signatories] --> B[Query signatories]
    B --> C[Order by role]
    C --> D[Return list]' "37-signatories-get"

# PUT signatory
render 'flowchart TB
    A[PUT /api/signatories/:role] --> B[Check auth]
    B --> C[Parse multipart]
    C --> D[Validate role]
    D --> E[Convert image to base64]
    E --> F[Update signatory]
    F --> G[Return updated]' "38-signatories-put"

echo ""
echo "✅ ¡Listo! Diagramas en: ${OUTPUT}/"
ls -la "${OUTPUT}"/*.png | wc -l
echo "archivos PNG"
