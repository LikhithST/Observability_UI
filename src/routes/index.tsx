// src/routes/index.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Workspace from '../pages/Workspace';
import Dashboard from '../pages/Dashboard';
import EditPanelPage from "../pages/EditPanelPage";


export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Workspace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/edit-panel/:panelId" element={<EditPanelPage />} />
        </Routes>
    );
};