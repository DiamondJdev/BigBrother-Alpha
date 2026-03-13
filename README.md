# BigBrother (Working Title)

## Overview
**BigBrother** is a desktop application designed to help IT departments evaluate software before it is approved for installation within an organization.

The application allows employees to request software and enables administrators to run automated tests that analyze how the software interacts with a system. The results allow administrators to determine whether the application should be approved or denied.

The system supports two primary user roles:

- **Client** — Requests software for business use.
- **Administrator** — Evaluates requested software and determines approval.

---

# Technology Stack

## Desktop Application
- **Electron** — Desktop application framework
- **React** — UI component framework
- **HTML**
- **JavaScript**
- **CSS**
  - **Tailwind CSS** for styling  
  https://tailwindcss.com/

## Additional Infrastructure (Planned)
- **Docker** — Sandbox environment for software testing
- **Cloud Agent** — Remote analysis system
- **Local Agent** — System-level monitoring

---

# Core Features

## System Monitoring
The application evaluates how requested software interacts with a system by monitoring:

- **CPU usage**
- **RAM usage**
- **Memory usage**
- **Network activity**
  - Outbound requests
  - External connections
- **File footprint**
  - File creation/modification
  - Checks against banned directories
- **System configuration changes**

## Analysis Pipeline
1. Application is uploaded or fetched from installer URL
2. Software is executed in a **Docker sandbox**
3. System metrics are recorded
4. File system changes are logged
5. Network activity is monitored
6. Results are displayed for administrators

The system provides a **before-and-after comparison** of system state.

---

# User Roles

## Client Role
Clients are employees requesting approval to install new software.

### Capabilities
- Create an account / login
- Submit software requests
- Track request status
- Receive approval or denial notifications

### Request Information
Clients must provide:

- **Application name**
- **Installer URL**
- **Description of intended business usage**

### Client Visibility
Clients can see:

- Request status
- Testing progress
- Approval or denial result

Clients **cannot see internal analytical data**.

---

## Administrator Role
Administrators are responsible for evaluating software requests.

### Capabilities
- Login to admin dashboard
- View all submitted requests
- See which user requested each application
- Run automated software tests
- View system changes caused by the application
- Approve or deny requests

### Administrative Insights
Admins can review:

- System resource usage
- Network traffic
- File system modifications
- Configuration changes
- Before/after system comparisons

---

# User Experience Flow

## Client Flow