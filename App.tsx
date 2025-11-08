import React from 'react';

// Main App Component
const App: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen font-sans text-center p-4">
            <h1 className="text-5xl font-extrabold text-[--color-accent] mb-4">
                Hello, Vercel!
            </h1>
            <p className="text-lg text-gray-400">
                Your React + Vite + TypeScript app is successfully deployed.
            </p>
            <p className="mt-8 text-sm text-gray-500">
                You can now start building your project. This is a minimal template.
            </p>
        </div>
    );
};

export default App;
