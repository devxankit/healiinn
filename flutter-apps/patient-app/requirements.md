## Patient App - Simple Structure

This Flutter app is focused solely on patient features such as appointment booking, viewing prescriptions, and personal profile management. The structure is intentionally simple and easy to maintain.

### Suggested File Structure

```
patient-app/
└── lib/
    ├── main.dart
    ├── screens/
    │   ├── home_screen.dart
    │   ├── appointments_screen.dart
    │   ├── prescriptions_screen.dart
    │   └── profile_screen.dart
    ├── widgets/
    │   └── custom_appbar.dart
    ├── models/
    │   ├── appointment.dart
    │   └── prescription.dart
    ├── services/
    │   └── api_service.dart
    ├── utils/
    │   └── constants.dart
    └── routes/
        └── app_routes.dart
```

### Short Development Instructions

- Place each main app screen in the `screens` folder.
- Put reusable UI components in the `widgets` folder.
- Define data models (e.g., Appointment, Prescription) in the `models` folder.
- Store API and logic code in the `services` folder.
- Place app-wide constants and helper functions in `utils`.
- Manage named routes for navigation in `routes/app_routes.dart`.
- `main.dart` is the entry point for the app.

This structure helps you quickly develop and maintain all essential patient features in a clean, organized manner.
