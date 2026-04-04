package com.univalle.personalfinance;

import android.Manifest;
import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * SmsPlugin — Plugin local de Capacitor para leer el buzón de SMS del dispositivo.
 *
 * ¿Por qué un plugin local en lugar de uno de terceros?
 * Ningún plugin publicado en npm soporta @capacitor/core v8.x para leer SMS.
 * Los plugins locales se registran directamente en MainActivity y tienen acceso
 * completo a las APIs de Android sin necesitar publicar un paquete npm.
 *
 * Arquitectura del bridge Capacitor:
 * JavaScript (Angular) → @PluginMethod → Java → ContentResolver → content://sms/inbox
 * El resultado viaja de vuelta como JSObject serializado a JSON.
 *
 * Permisos requeridos en AndroidManifest.xml:
 * - android.permission.READ_SMS
 */
@CapacitorPlugin(
    name = "Sms",
    permissions = {
        @Permission(
            strings = { Manifest.permission.READ_SMS },
            alias = "readSms"
        )
    }
)
public class SmsPlugin extends Plugin {

    /**
     * Lee el buzón de SMS (content://sms/inbox) con filtros opcionales.
     *
     * Parámetros JS (todos opcionales):
     * - fromAddress: string  — filtra por remitente (coincidencia parcial, case-insensitive)
     * - minDate:     number  — timestamp Unix en ms, solo SMS desde esta fecha
     * - maxCount:    number  — límite máximo de SMS a retornar (default: 100)
     *
     * Retorna: { smsList: Array<{ id, address, body, date }> }
     *
     * ContentProvider content://sms/inbox:
     * Columnas relevantes: _id, address (remitente), body (texto), date (timestamp ms)
     * Ordenado por date DESC para obtener los más recientes primero.
     */
    @PluginMethod
    public void getSmsInbox(PluginCall call) {
        // Verificar que el permiso READ_SMS fue otorgado antes de intentar leer
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("readSms", call, "readSmsPermissionCallback");
            return;
        }

        String fromAddress = call.getString("fromAddress", null);
        long minDate      = call.getLong("minDate", 0L);
        int maxCount      = call.getInt("maxCount", 100);

        JSArray smsList = new JSArray();

        ContentResolver contentResolver = getContext().getContentResolver();
        Uri smsUri = Uri.parse("content://sms/inbox");

        // Columnas a proyectar — solo las necesarias para minimizar el overhead
        String[] projection = { "_id", "address", "body", "date" };

        // Construir la cláusula WHERE dinámica
        StringBuilder selection = new StringBuilder();
        java.util.List<String> selectionArgs = new java.util.ArrayList<>();

        if (minDate > 0) {
            selection.append("date >= ?");
            selectionArgs.add(String.valueOf(minDate));
        }

        if (fromAddress != null && !fromAddress.isEmpty()) {
            if (selection.length() > 0) selection.append(" AND ");
            // LIKE con % para coincidencia parcial (el banco puede usar número corto o nombre)
            selection.append("address LIKE ?");
            selectionArgs.add("%" + fromAddress + "%");
        }

        String selectionStr = selection.length() > 0 ? selection.toString() : null;
        String[] selectionArgsArr = selectionArgs.isEmpty() ? null : selectionArgs.toArray(new String[0]);

        Cursor cursor = contentResolver.query(
            smsUri,
            projection,
            selectionStr,
            selectionArgsArr,
            "date DESC"  // más recientes primero
        );

        if (cursor != null) {
            int count = 0;
            while (cursor.moveToNext() && count < maxCount) {
                JSObject sms = new JSObject();
                sms.put("id",      cursor.getLong(cursor.getColumnIndexOrThrow("_id")));
                sms.put("address", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                sms.put("body",    cursor.getString(cursor.getColumnIndexOrThrow("body")));
                sms.put("date",    cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                smsList.put(sms);
                count++;
            }
            cursor.close();
        }

        JSObject result = new JSObject();
        result.put("smsList", smsList);
        call.resolve(result);
    }

    /**
     * Callback invocado por Capacitor después de que el usuario responde al
     * diálogo de permisos READ_SMS solicitado en getSmsInbox().
     *
     * Si el usuario concede el permiso, reintenta la llamada original.
     * Si lo deniega, retorna un error descriptivo al JavaScript.
     */
    @PermissionCallback
    private void readSmsPermissionCallback(PluginCall call) {
        if (hasRequiredPermissions()) {
            getSmsInbox(call);
        } else {
            call.reject("READ_SMS permission denied by user");
        }
    }
}
