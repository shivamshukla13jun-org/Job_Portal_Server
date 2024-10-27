export const postedatesCondition=(createdAt:string)=>{
        const now = new Date();
        let startDate: Date | undefined;
        switch (createdAt) {
            case 'lh': // Last hour
                startDate = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h': // Last 24 hours
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d': // Last 7 days
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '14d': // Last 14 days
                startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                break;
            case '30d': // Last 30 days
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '6m': // Last 6 months
                startDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case '12m': // Last 12 months
                startDate = new Date(now.setMonth(now.getMonth() - 12));
                break;
            case '16m': // Last 16 months
                startDate = new Date(now.setMonth(now.getMonth() - 16));
                break;
            case '24m': // Last 24 months
                startDate = new Date(now.setMonth(now.getMonth() - 24));
                break;
            case '5y': // Last 5 years
                startDate = new Date(now.setFullYear(now.getFullYear() - 5));
                break;
            default:
                startDate = undefined;
        }
        return startDate
        
    
}