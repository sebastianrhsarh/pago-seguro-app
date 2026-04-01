import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  role: 'buyer' | 'seller';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Inicializar con usuario fake
    const fakeUser: User = {
      id: 'user_1',
      name: 'Sebastian',
      role: 'buyer'
    };
    this.setUser(fakeUser);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User): void {
    this.userSubject.next(user);
  }
}