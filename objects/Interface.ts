export interface DatabaseObject {
     id: string;
     save(): Promise<boolean>;
     delete(): Promise<boolean>;
}