"use client";

interface ClassItem {
    id: number | string;
    title: string;
    time: string;
    location?: string;
    day: string;
    month: string;
}

interface UpcomingClassesProps {
    classes?: ClassItem[];
}

export function UpcomingClasses({ classes = [] }: UpcomingClassesProps) {
    // Default mock data if none provided
    const displayClasses = classes.length > 0 ? classes : [
        { id: 1, title: "Drill Practice - Alpha Platoon", time: "06:00 AM - 08:00 AM • Parade Ground", day: "25", month: "OCT" },
        { id: 2, title: "Theory Class - Map Reading", time: "09:00 AM - 10:00 AM • Room 302", day: "26", month: "OCT" },
        { id: 3, title: "Weapon Training", time: "07:00 AM - 09:00 AM • Firing Range", day: "28", month: "OCT" },
    ];

    return (
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4">Upcoming Classes</h3>
            <div className="space-y-4">
                {displayClasses.map((item) => (
                    <div key={item.id} className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-primary/5 border border-primary/10 flex-shrink-0 flex flex-col items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="text-xs uppercase">{item.month}</span>
                            <span className="text-lg leading-none">{item.day}</span>
                        </div>
                        <div className="ml-4 flex-1">
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.time}</p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary hover:text-white transition-all">
                            View
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
