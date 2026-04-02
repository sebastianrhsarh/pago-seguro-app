import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyCi4A6PkYNsMq8UbylZRD2mL_mXTavFqoc",
  authDomain: "pago-seguro-app.firebaseapp.com",
  projectId: "pago-seguro-app",
  storageBucket: "pago-seguro-app.firebasestorage.app",
  messagingSenderId: "851282382430",
  appId: "1:851282382430:web:f5afba36c9b3c8f0e8eecf"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
