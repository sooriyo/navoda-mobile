// src/app/services/unit.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Unit {
    unitId: number;
    unitCode: string;
    unitName: string;
    unitSymbol: string;
}

@Injectable({
    providedIn: 'root'
})
export class UnitService {
    private apiUrl = 'https://api.navoda.fusion.lumiraq.com/unit';

    constructor(private http: HttpClient) {}

    getUnits(): Observable<Unit[]> {
        return this.http.get<Unit[]>(this.apiUrl);
    }
}
