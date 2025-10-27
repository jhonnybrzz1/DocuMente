import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Version {
  id: number;
  content: string;
  timestamp: string;
}

const VersionHistory: React.FC = () => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [newRule, setNewRule] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addVersion = (content: string) => {
    const newVersion: Version = {
      id: versions.length + 1,
      content,
      timestamp: new Date().toISOString(),
    };
    setVersions([...versions, newVersion]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRule.trim()) {
      addVersion(newRule);
      setNewRule('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Histórico de Versões</h2>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Adicionar Nova Versão</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Regra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Digite a nova regra aqui..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              className="min-h-[100px]"
            />
            <Button type="submit">Gerar Nova Versão</Button>
          </form>
        </DialogContent>
      </Dialog>
      <div className="mt-4 space-y-4">
        {versions.map((version) => (
          <div key={version.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Versão {version.id}</h3>
              <span className="text-sm text-gray-500">{new Date(version.timestamp).toLocaleString()}</span>
            </div>
            <p className="whitespace-pre-wrap">{version.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionHistory;