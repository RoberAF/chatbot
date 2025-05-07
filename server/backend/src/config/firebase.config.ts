import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FirebaseService implements OnModuleInit {
  async onModuleInit() {
    // Inicializar Firebase Admin solo si no está ya inicializado
    if (!admin.apps.length) {
      // Si tienes una cuenta de servicio como JSON
      /*
      const serviceAccount = require('../path/to/serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      */
      
      // O simplemente usando variables de entorno (recomendado)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
  
  getAuth() {
    return admin.auth();
  }
}