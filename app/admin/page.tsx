"use client";

import { useState } from "react";
import {
  Users,
  Eye,
  CalendarCheck,
  Award,
  Newspaper,
  Building,
  BookOpen,
  MapPin,
  ArrowUp,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Visitors", value: "12,345", icon: Users, trend: "+12%", color: "blue" },
    { title: "Page Views", value: "45,678", icon: Eye, trend: "+8%", color: "green" },
    { title: "Admissions", value: "156", icon: CalendarCheck, trend: "+5%", color: "purple" },
    { title: "Results", value: "89", icon: Award, trend: "+3%", color: "orange" },
    { title: "News", value: "234", icon: Newspaper, trend: "+15%", color: "red" },
    { title: "Institutes", value: "45", icon: Building, trend: "+2%", color: "indigo" },
    { title: "Programs", value: "89", icon: BookOpen, trend: "+7%", color: "pink" },
    { title: "Cities", value: "23", icon: MapPin, trend: "+1%", color: "teal" },
  ];

  const recentActivities = [
    { id: 1, title: "New admission opened for FAST University", time: "2 min ago", type: "admission" },
    { id: 2, title: "BISE Lahore results announced", time: "1 hour ago", type: "result" },
    { id: 3, title: "HEC scholarship deadline extended", time: "3 hours ago", type: "news" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Live Visitors */}
      <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} />
            <div>
              <p className="text-lg font-semibold">48 Active Visitors</p>
              <p className="text-sm text-green-100">Real-time visitors on your site</p>
            </div>
          </div>
          <Link href="/admin/analytics" className="px-3 py-1 bg-white/20 rounded-lg text-sm">
            View Details →
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <ArrowUp size={12} /> {stat.trend}
                </p>
              </div>
              <div className={`p-2 bg-${stat.color}-50 rounded-lg`}>
                <stat.icon size={20} className={`text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        <div className="divide-y">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{activity.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}