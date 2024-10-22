export function generateNumber(length: number = 4): number {
    if (length !== 4) {
        throw new Error('Required 4 length');
    }
    return Math.floor(1000 + Math.random() * 9000);
}