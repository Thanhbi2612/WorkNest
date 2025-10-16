import { useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

const ThemeProvider = ({ children }) => {
    const { settings } = useSettings();

    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.remove('color-cyan', 'color-purple', 'color-blue', 'color-green', 'color-red');
        root.classList.remove('font-size-normal', 'font-size-large');

        // Apply theme mode
        root.classList.add(`theme-${settings.appearance.mode}`);

        // Apply primary color
        root.classList.add(`color-${settings.appearance.primaryColor}`);

        // Apply font size
        root.classList.add(`font-size-${settings.appearance.fontSize}`);

        // Update body background
        const body = document.body;
        if (settings.appearance.mode === 'light') {
            body.style.background = '#ffffff';
        } else {
            body.style.background = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)';
        }
    }, [settings.appearance]);

    return children;
};

export default ThemeProvider;
