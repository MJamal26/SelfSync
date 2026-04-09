import React from 'react';
import { StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function Root() {
  const { theme } = useTheme();
  return (
    <>
      <AppNavigator />
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />
      {/* Toast must be last child so it renders above everything */}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

