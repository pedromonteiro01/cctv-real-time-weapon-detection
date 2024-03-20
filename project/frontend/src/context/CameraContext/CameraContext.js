import React, { createContext, useContext, useState } from 'react';

const CameraContext = createContext();

export const useCamera = () => useContext(CameraContext);

export const CameraProvider = ({ children }) => {
    const [selectedCameraId, setSelectedCameraId] = useState('');

    const value = {
        selectedCameraId,
        setSelectedCameraId,
    };

    return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};
