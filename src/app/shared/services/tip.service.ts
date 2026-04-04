import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FinancialTip } from '../../features/learning/interfaces/learning-content.interfaces';
import { environment } from '../../../environments/environment';

interface TipDTO {
    id: number;
    title: string;
    author: string;
    authorTitle: string | null;
    shortDescription: string | null;
    description: string;
    imageSrc: string | null;
    tags: string | null;
    reason?: string | null;
    createdAt: string;
}

interface TipListResponse {
    data: TipDTO[];
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class TipService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/api/tips`;

    getRecommendedTips(): Observable<FinancialTip[]> {
        return this.http.get<TipListResponse>(`${this.apiUrl}/recommended`).pipe(
            map(response => response.data.map(dto => this.mapDtoToTip(dto)))
        );
    }

    getAllTips(): Observable<FinancialTip[]> {
        return this.http.get<TipListResponse>(this.apiUrl).pipe(
            map(response => response.data.map(dto => this.mapDtoToTip(dto)))
        );
    }

    private mapDtoToTip(dto: TipDTO): FinancialTip {
        return {
            id: dto.id,
            title: dto.title,
            author: dto.author,
            authorTitle: dto.authorTitle ?? undefined,
            shortDescription: dto.shortDescription ?? undefined,
            description: dto.description,
            imageSrc: dto.imageSrc ?? undefined,
            reason: dto.reason ?? undefined,
        };
    }
}