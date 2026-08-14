"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, FileCode2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Skill = {
  id: string;
  name: string;
  description: string;
  content: string;
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Temporary state for the currently edited skill
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    let initialSkills: Skill[] = [];
    const saved = localStorage.getItem("script-factory-skills");
    if (saved) {
      try {
        initialSkills = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse skills", e);
      }
    } else {
      // Migrate old customInstructions if exists
      const oldInstructions = localStorage.getItem("customInstructions");
      if (oldInstructions) {
        const migratedSkill = {
          id: crypto.randomUUID(),
          name: "Legacy Instructions",
          description: "Migrated from previous version.",
          content: oldInstructions,
        };
        initialSkills = [migratedSkill];
        localStorage.setItem("script-factory-skills", JSON.stringify([migratedSkill]));
        localStorage.removeItem("customInstructions");
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSkills(initialSkills);
  }, []);

  const saveSkills = (newSkills: Skill[]) => {
    setSkills(newSkills);
    localStorage.setItem("script-factory-skills", JSON.stringify(newSkills));
  };

  const handleCreate = () => {
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: "New Custom Skill",
      description: "Description of what this skill does.",
      content: "-- Add your specific instructions, snippets or context here.",
    };
    saveSkills([newSkill, ...skills]);
    startEditing(newSkill);
  };

  const handleDelete = (id: string) => {
    saveSkills(skills.filter(s => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const startEditing = (skill: Skill) => {
    setEditingId(skill.id);
    setEditName(skill.name);
    setEditDescription(skill.description);
    setEditContent(skill.content);
  };

  const handleSave = () => {
    if (!editingId) return;
    const updated = skills.map(s => {
      if (s.id === editingId) {
        return {
          ...s,
          name: editName,
          description: editDescription,
          content: editContent,
        };
      }
      return s;
    });
    saveSkills(updated);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <div className="flex items-center justify-between p-6 border-b border-border bg-surface shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Skills & Context</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define custom knowledge, rules, or snippets to guide the generation process.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          New Skill
        </Button>
      </div>

      <div className="flex-1 overflow-hidden grid lg:grid-cols-[300px_1fr] gap-0">
        {/* Sidebar */}
        <div className="overflow-y-auto border-r border-border bg-surface-2/30 p-4 space-y-3">
          {skills.length === 0 ? (
            <div className="text-center p-6 border border-dashed border-border rounded-lg text-muted-foreground">
              <FileCode2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom skills yet</p>
            </div>
          ) : (
            skills.map(skill => (
              <div 
                key={skill.id}
                onClick={() => startEditing(skill)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  editingId === skill.id 
                    ? "bg-surface border-accent shadow-sm" 
                    : "bg-surface/50 border-border/50 hover:border-accent/50 hover:bg-surface"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-sm text-foreground truncate pr-2">{skill.name}</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">Custom</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{skill.description}</p>
              </div>
            ))
          )}
        </div>

        {/* Editor */}
        <div className="flex flex-col h-full overflow-hidden bg-surface">
          {editingId ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2/30">
                <div className="flex items-center gap-3 w-full max-w-[60%]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Edit2 className="h-4 w-4" />
                  </span>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 font-medium text-foreground text-lg w-full"
                    placeholder="Skill Name"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(editingId)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSave} size="sm" className="gap-1.5">
                    <Save className="h-4 w-4" />
                    Save Skill
                  </Button>
                </div>
              </div>
              <div className="p-4 border-b border-border bg-background">
                <input
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-muted-foreground w-full"
                  placeholder="Briefly describe when this skill should be used..."
                />
              </div>
              <div className="flex-1 p-4 overflow-hidden relative">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="absolute inset-4 resize-none bg-background border border-border/50 rounded-lg p-4 font-mono text-[13px] leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  placeholder="Enter context, rules, or code snippets here. The generator will use this when relevant..."
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border/50 flex items-center justify-center mb-4">
                <FileCode2 className="h-8 w-8 opacity-50" />
              </div>
              <h2 className="text-xl font-medium text-foreground mb-2">Select or create a skill</h2>
              <p className="text-sm max-w-sm mb-6">
                Skills let you attach reusable code snippets, rules, and logic patterns that the generator can reference.
              </p>
              <Button onClick={handleCreate} variant="outline" className="gap-2">
                Create new skill <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
