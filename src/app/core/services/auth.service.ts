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
  private readonly demoBuyerId = 'user_1';
  private readonly demoSellerId = 'i3sjwuEcszRiB0LpLz6N';
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // TODO: reemplazar por Firebase Authentication en próxima iteración.
    // Para el MVP mantenemos un comprador demo como usuario actual y un vendedor demo fijo.
    const fakeUser: User = {
      id: this.demoBuyerId,
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

  getDemoBuyerId(): string {
    return this.demoBuyerId;
  }

  getDemoSellerId(): string {
    return this.demoSellerId;
  }
}