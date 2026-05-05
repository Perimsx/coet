import AdminSuggestionsClient from "@/features/admin/suggestions/AdminSuggestionsClient";
import {
  getSuggestionTemplatesAction,
  getSuggestionsAction,
} from "@/features/admin/suggestions/actions";

export const metadata = {
  title: "建议管理 - 后台",
};

export default async function SuggestionsPage() {
  const [suggestions, templates] = await Promise.all([
    getSuggestionsAction(),
    getSuggestionTemplatesAction(),
  ]);

  return (
    <AdminSuggestionsClient initialData={suggestions} templates={templates} />
  );
}
