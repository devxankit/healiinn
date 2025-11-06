## Doctor App - Modular Structure

This Flutter app includes three main modules:
1. **Doctors**
2. **Pharmacy**
3. **Laboratory**

Each module is implemented as a separate feature with its own UI and logic, but all run under a single Flutter project.

### Suggested File Structure

```
doctor-app/
└── lib/
    ├── main.dart
    ├── modules/
    │   ├── doctors/
    │   │   ├── screens/
    │   │   ├── widgets/
    │   │   ├── models/
    │   │   └── doctors_module.dart
    │   ├── pharmacy/
    │   │   ├── screens/
    │   │   ├── widgets/
    │   │   ├── models/
    │   │   └── pharmacy_module.dart
    │   └── laboratory/
    │       ├── screens/
    │       ├── widgets/
    │       ├── models/
    │       └── laboratory_module.dart
    ├── shared/
    │   ├── widgets/
    │   ├── utils/
    │   └── constants.dart
    └── routes/
        └── app_routes.dart
```

### Short Development Instructions

- Structure the app with **three modules** under `lib/modules`: doctors, pharmacy, laboratory.
- Place each module's screens, widgets, and logic in its respective folder.
- Use a common `shared` folder for shared components like widgets and utilities.
- Use main navigation (tab bar, drawer, or bottom navigation) for switching between modules.
- Define app routes for navigation in the `routes/app_routes.dart` file.
- Configure the module entry points in `main.dart`.

This structure helps maintain clear separation between doctor, pharmacy, and laboratory features while sharing common functionality easily.
