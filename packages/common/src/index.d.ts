export declare class Link {
    id: string;
    url: string;
    title: string;
    description?: string;
    createdAt: Date;
}
export declare class CreateLinkDto {
    url: string;
    title: string;
    description?: string;
}
