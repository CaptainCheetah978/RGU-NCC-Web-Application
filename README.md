# NCC RGU Web Application

A comprehensive web application for the National Cadet Corps (NCC) of Royal Global University (RGU), designed to manage attendance, class records, and cadet information.

## Features

- **Dashboard**: Overview of NCC activities and stats.
- **Attendance Management**: Track cadet attendance efficiently.
- **Class Records**: Manage and organize class data.
- **Resource Sharing**: Upload and share PDFs, images, and videos.

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS, Shadcn/ui
- **Icons**: Lucide React
- **Language**: TypeScript

## Configuration

Currently, the application is configured to run out-of-the-box for development.

### Environment Variables
As the project evolves, you may need to configure environment variables. When that happens:
1. Copy `.env.example` to `.env.local`.
2. Update the values in `.env.local` with your specific configuration (e.g., database credentials, API keys).

*No `.env` file is required for the initial setup.*

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app`: Application routes and pages.
- `/src/components`: Reusable UI components.
- `/public`: Static assets.
