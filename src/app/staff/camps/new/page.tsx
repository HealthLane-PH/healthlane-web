"use client";

import { useState } from "react";

export default function NewCampPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [picture, setPicture] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [waitlist, setWaitlist] = useState(false);

  const categories = [
    "Day Off Camps",
    "Seasonal Camps",
    "Multi-Day Camps",
    "Holiday All-Ages Events",
    "OpenShop",
  ];

  const handleCategoryChange = (cat: string) => {
    setCategory((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      title,
      category,
      description,
      picture,
      startDate,
      endDate,
      startTime,
      endTime,
      minAge,
      maxAge,
      price,
      capacity,
      isPublic,
      waitlist,
    });
    alert("Camp saved (for now, just logs data)!");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Camp</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Camp Title*</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category*</label>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={category.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
            rows={4}
          />
        </div>

        {/* Picture */}
        <div>
          <label className="block text-sm font-medium mb-1">Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPicture(e.target.files?.[0] || null)}
          />
        </div>

        {/* Dates + Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date*</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date*</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Time*</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Time*</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
        </div>

        {/* Age + Price + Capacity */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Min Age</label>
            <input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Age</label>
            <input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)*</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Participants*</label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full border px-3 py-2 rounded-md"
            required
          />
        </div>

        {/* Public/Private + Waitlist */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={isPublic}
              onChange={() => setIsPublic(true)}
            />{" "}
            Public
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!isPublic}
              onChange={() => setIsPublic(false)}
            />{" "}
            Private
          </label>

          <label className="flex items-center gap-2 ml-6">
            <input
              type="checkbox"
              checked={waitlist}
              onChange={() => setWaitlist(!waitlist)}
            />{" "}
            Waitlist Enabled
          </label>
        </div>

        {/* Checkout Forms (placeholder) */}
        <div>
          <label className="block text-sm font-medium mb-1">Checkout Forms</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled /> Placeholder Form 1
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled /> Placeholder Form 2
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer"
          >
            Save Camp
          </button>
        </div>
      </form>
    </div>
  );
}