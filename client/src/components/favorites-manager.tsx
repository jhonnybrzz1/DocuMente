import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "@shared/schema";

interface FavoritesManagerProps {
  documents: Document[];
  onToggleFavorite: (documentId: number, isFavorite: boolean) => void;
}

export default function FavoritesManager({ documents, onToggleFavorite }: FavoritesManagerProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<number[]>(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem("documente-favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Save favorites to localStorage whenever they change
    localStorage.setItem("documente-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (documentId: number) => {
    const isCurrentlyFavorite = favorites.includes(documentId);
    
    let updatedFavorites;
    if (isCurrentlyFavorite) {
      updatedFavorites = favorites.filter(id => id !== documentId);
      toast({
        title: "Removido dos favoritos",
        description: "O documento foi removido dos seus favoritos.",
        variant: "default",
      });
    } else {
      updatedFavorites = [...favorites, documentId];
      toast({
        title: "Adicionado aos favoritos",
        description: "O documento foi adicionado aos seus favoritos.",
        variant: "default",
      });
    }

    setFavorites(updatedFavorites);
    onToggleFavorite(documentId, !isCurrentlyFavorite);
  };

  const favoriteDocuments = documents.filter(doc => favorites.includes(doc.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="mr-2 text-yellow-500" size={20} />
          Meus Favoritos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favoriteDocuments.length === 0 ? (
          <div className="text-center py-8">
            <StarOff className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-muted-foreground mb-2">
              Você ainda não tem documentos favoritos.
            </p>
            <p className="text-sm text-muted-foreground">
              Clique no ícone de estrela nos documentos para adicioná-los aos favoritos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {doc.originalDemand.slice(0, 50)}...
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(doc.id)}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <Star className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}