# National Cadet Corps System Architecture

This document provides a high-level overview of the system architecture, access control, and data flow mechanisms utilized within the National Cadet Corps Cadet Management System.

## Architecture Diagrams

### 1. Authentication Flow
The system maps username + PIN credentials to Supabase Auth's email/password flow, providing a seamless identity experience with standardized security.

```mermaid
sequenceDiagram
    participant User
    participant Client as Next.js Client
    participant Server as Auth Context / Supabase Auth
    participant DB as Supabase Profiles Table

    User->>Client: Enters Regt. Number & PIN
    Client->>Server: Maps to pseudo-email & secure-padded PIN
    Server->>Server: supabase.auth.signInWithPassword()
    Server->>DB: Fetch associated Cadet Profile
    DB-->>Server: Returns Profile Data (Role, Name, etc.)
    Server-->>Client: Update Auth State / Set Session
    Client->>User: Redirects to Dashboard
```

### 2. Permission Decision Tree
Row-Level Security (RLS) and server-side logic dictate operations based on the user's role.

```mermaid
graph TD
    A[Incoming Request] --> B{Valid Session?}
    B -- No --> C[Redirect to Login]
    B -- Yes --> D{Evaluate Role Profile}
    
    D -- "ANO" --> E[SuperAdmin]
    E --> E1[Full Database Bypass via supabaseAdmin]
    E1 --> E2[Manage all Cadets, Classes, Notes, Announcements]
    
    D -- "SUO" --> F[Admin]
    F --> F1[Standard Auth Context]
    F1 --> F2[Read/Write Class, Attendance, Registry]
    
    D -- "UO/SGT" --> G[Moderator]
    G --> G1[Write Attendance, Read Registry]
    
    D -- "Cadet" --> H[Standard User]
    H --> H1[Read/Write Personal Profile]
    H1 --> H2[Read Scoped Notes / Certificates]
```

### 3. Data Flow Between Client & Server
We use the standard Supabase client for safe client-side reads, and Next.js Server Actions with the \`supabaseAdmin\` client for writes that need to bypass RLS.

```mermaid
flowchart TD
    subgraph Client Application
        CC[Client Components]
        Context[React Context Providers]
    end
    
    subgraph Next.js Backend
        SA[Server Actions]
        AuthGuard[Server Role Guard]
    end

    subgraph Supabase Backend
        API[PostgREST API]
        RLS[Row Level Security]
        DB[(PostgreSQL Database)]
    end

    %% Real-time and Read functionality
    Context -- "Realtime Subscriptions" --> API
    CC -- "Select Queries" --> API
    API --> RLS --> DB

    %% Write and Admin functionality
    CC -- "Form Submissions" --> SA
    SA --> AuthGuard
    AuthGuard -- "Bypass RLS (Admin Only)" --> DB
    AuthGuard -- "Standard Update" --> API
```

### 4. ID Card Export Pipeline
We use `html-to-image` to export the ID card as a PNG so it prints consistently across different mobile devices without CSS layout breaks.

```mermaid
sequenceDiagram
    participant User
    participant DOM as Digital ID Component
    participant HTI as html-to-image
    participant Output as Image Blob / Print Spooler

    User->>DOM: Clicks "Download" or "Print"
    DOM->>HTI: Triggers `toPng` transformation
    HTI->>DOM: Clones element at rigid 500x312px bounds
    Note over HTI: Wraps card to preserve 'shadow-2xl' and 'rounded-3xl'
    HTI-->>DOM: Returns Base64 PNG snapshot
    
    alt is Downloading
        DOM->>Output: Triggers `<a href="..." download>`
    else is Printing
        DOM->>Output: Overlays high-res <img> on screen with max z-index
        Output->>User: Invokes `window.print()` automatically
    end
```

### 5. Dynamic QR Security Flow (Dual-Mode)
To prevent screenshot spoofing and replay attacks, the digital ID card uses a constantly rotating, cryptographically signed JWT. For static media (prints/downloads), it automatically switches to a stable Verification ID to ensure long-term validity without compromising live security.

| Mode | Trigger | Payload | Security |
| :--- | :--- | :--- | :--- |
| **Live (On-Screen)** | Default | **JWT (Signed)** | High: Expiring (30s) + Anti-Screenshot |
| **Static (Print/PDF)** | Print/Download | **Cadet ID (Stable)** | Medium: Database Photo Match required |

```mermaid
sequenceDiagram
    participant Cadet
    participant IDCard as Digital ID UI
    participant Server as JWT Action (jose)
    participant Scanner as Verifier (ANO/Guard)

    Cadet->>IDCard: Opens Profile Page
    loop Every 25 seconds
        IDCard->>Server: Request Verification Token
        Server->>Server: Verify Session & Identity
        Server-->>IDCard: Returns JWT (exp: 30s)
        IDCard->>IDCard: Updates QR Code Payload
    end
    
    Scanner->>IDCard: Scans QR Code
    Scanner->>Server: Requests verification with JWT
    Server->>Server: Validates Signature & Expiration
    
    alt Token Valid
        Server-->>Scanner: Returns Authentic Verified Profile
    else Token Expired or Invalid
        Server-->>Scanner: Returns "QR Code Expired" Error
    end
```

### 6. Privileged Access vs Public Client
The system utilizes two distinct Supabase clients to enforce the security boundary between standard user operations and administrative tasks.

*   **Public Client (`src/lib/supabase-client.ts`)**: Used in client-side components. Every request is filtered by the user's JWT and must satisfy PostgreSQL Row Level Security (RLS) policies.
*   **Admin Client (`src/lib/supabase-admin.ts`)**: Used exclusively in Server Actions. It utilizes the `SERVICE_ROLE_KEY` to bypass RLS. This is required for operations that affect multiple users or systems where standard user credentials lack the necessary scope (e.g., bulk attendance updates by an ANO).

### 7. Offline Data Synchronization
To support environments with limited connectivity, the system implements a queue-based synchronization mechanism using a Service Worker and IndexedDB.

```mermaid
flowchart LR
    A[User UI] --> B{Network State}
    B -- Online --> C[Immediate Server Action]
    B -- Offline --> D[IndexedDB Queue]
    
    D --> E[Service Worker Listener]
    E -- On Connection --> F[Batch Processing]
    F --> G[Supabase Backend]
    
    G -- Success --> H[Clear Queue]
    G -- Failure --> I[Retry Logic / Conflict Resolution]
```


