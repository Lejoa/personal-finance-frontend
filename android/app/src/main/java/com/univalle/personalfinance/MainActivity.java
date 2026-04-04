package com.univalle.personalfinance;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Registrar el plugin local SmsPlugin antes de inicializar el bridge.
        // registerPlugin() debe llamarse ANTES de super.onCreate() para que el
        // bridge de Capacitor incluya el plugin al inicializar el WebView.
        registerPlugin(SmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
