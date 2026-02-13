"use client";

import { useAuth } from "@/lib/auth-context";

import { Users, Calendar, CheckCircle, FileText, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

// Inline Card for now to save a tool call, or I should have created it.
// Actually, I'll create a Card component in a separate file in the next turn if needed, 
// but for now I'll use standard divs with glass classes or create a local component.
// Let's create a local Card component here for simplicity then refactor if needed.

function InfoCard({ title, value, icon: Icon, trend, color, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-10 -mt-10`} />

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className="text-green-600 font-medium flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </motion.div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500">Here's what's happening in your unit today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard
                    title="Total Cadets"
                    value="124"
                    icon={Users}
                    trend="+12%"
                    color="blue"
                    delay={0.1}
                />
                <InfoCard
                    title="Attendance Rate"
                    value="92%"
                    icon={CheckCircle}
                    trend="+5%"
                    color="green"
                    delay={0.2}
                />
                <InfoCard
                    title="Active Classes"
                    value="3"
                    icon={Calendar}
                    color="orange"
                    delay={0.3}
                />
                <InfoCard
                    title="Pending Reports"
                    value="7"
                    icon={FileText}
                    color="red"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4">Upcoming Classes</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex-shrink-0 flex flex-col items-center justify-center text-blue-700 font-bold">
                                    <span className="text-xs uppercase">OCT</span>
                                    <span className="text-lg leading-none">25</span>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h4 className="font-bold text-gray-900">Drill Practice - Alpha Platoon</h4>
                                    <p className="text-sm text-gray-500">06:00 AM - 08:00 AM • Parade Ground</p>
                                </div>
                                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                    <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                        {[
                            { text: "SUO Rahul marked attendance for Class 1A", time: "2 hours ago" },
                            { text: "Cadet Priya uploaded 'Medical Certificate'", time: "4 hours ago" },
                            { text: "New Class 'Weapon Training' scheduled", time: "Yesterday" }
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-200 border-2 border-white"></div>
                                <p className="text-sm font-medium text-gray-800">{item.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
