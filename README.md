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

## getting Started

### Prerequisites

- Node.js 18+ installed
- Git installed

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/CaptainCheetah978/RGU-NCC-Web-Application.git
   cd ncc-rgu-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the App**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to a GitHub repository.
2. Go to Vercel and **Import** your project.
3. Vercel will detect Next.js and configure the build settings automatically.
4. Click **Deploy**.

## User Guide

- **Dashboard**: View upcoming classes and recent activity.
- **Classes**: Schedule new training sessions. Click **"View Attendance"** on any class to jump to the register.
- **Attendance**: 
    - Select a class from the dropdown.
    - Mark cadets as **Present (Green)**, **Absent (Red)**, or **Late (Amber)**.
    - Click **"Export CSV"** to download the attendance report.
- **Data Persistence**: All data is currently stored in your browser's `localStorage`. Clearing cache will reset the data.

## Project Structure

- `/src/app`: Application routes and pages.
- `/src/components`: Reusable UI components.
- `/public`: Static assets.
