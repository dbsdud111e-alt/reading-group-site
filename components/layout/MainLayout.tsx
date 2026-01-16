import React from 'react';
import { Sidebar } from './Sidebar';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-white text-[#37352F] antialiased">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
