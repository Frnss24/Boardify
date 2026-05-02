import { Save, Trash2, Image as ImageIcon, Layout, Sliders, Archive } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl w-full pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Workspace Settings</h1>
        <p className="text-sm text-slate-500">Manage your workspace identity and board preferences.</p>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Workspace Identity */}
        <div className="bg-white rounded-2xl border border-indigo-50/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">Workspace Identity</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-400 transition-colors cursor-pointer">
                <ImageIcon size={28} />
              </div>
              <div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  Upload New Logo
                </button>
                <p className="text-xs text-slate-400 mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Workspace Name</label>
                <input 
                  type="text" 
                  defaultValue="" 
                  placeholder="Workspace name"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Workspace Description</label>
                <input 
                  type="text" 
                  defaultValue="" 
                  placeholder="Workspace description"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Board Preferences */}
        <div className="bg-white rounded-2xl border border-indigo-50/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Layout size={18} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-800">Board Preferences</h2>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Setting Item 1: Kanban Columns */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
              <div>
                <h3 className="font-medium text-slate-800">Default Kanban Columns</h3>
                <p className="text-sm text-slate-500 mt-1">Start new projects with a standard set of columns.</p>
              </div>
              <select className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option>To Do, Doing, Done</option>
                <option>Backlog, Active, Review, Closed</option>
                <option>Custom Setup</option>
              </select>
            </div>

            {/* Setting Item 2: Auto-Archive (Done Color Match) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl h-fit mt-0.5"><Archive size={18} /></div>
                <div>
                  <h3 className="font-medium text-slate-800">Auto-Archive Completed Tasks</h3>
                  <p className="text-sm text-slate-500 mt-1">Automatically hide tasks from the board after 7 days in 'Done'.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            {/* Setting Item 3: WIP Limits (Doing Color Match) */}
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-start">
                <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl h-fit mt-0.5"><Sliders size={18} /></div>
                <div>
                  <h3 className="font-medium text-slate-800">Work-In-Progress (WIP) Limits</h3>
                  <p className="text-sm text-slate-500 mt-1">Highlight columns when tasks exceed a specific limit.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No numeric preferences loaded yet.
            </div>

          </div>
        </div>

        {/* Global Action Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-indigo-500 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-indigo-600 shadow-md shadow-indigo-200 transition-all">
            <Save size={18} /> Save Preferences
          </button>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 bg-red-50/50 p-6 rounded-2xl border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-red-700 mb-1">Delete Workspace</h2>
            <p className="text-sm text-red-600/80">Permanently delete this workspace, all boards, and tasks. This cannot be undone.</p>
          </div>
          <button className="flex-shrink-0 flex items-center gap-2 bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm">
            <Trash2 size={18} /> Delete Workspace
          </button>
        </div>

      </div>
    </div>
  );
}