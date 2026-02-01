import { SfuEvent } from "./enums/SfuEvent";

export interface SfuError {
    event: SfuEvent.ERROR;
    message: string;
}