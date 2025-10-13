import { v4 as uuidv4 } from "uuid";

export const generateId = () => uuidv4();

export const randomPick = arr => arr[Math.floor(Math.random() * arr.length)];
