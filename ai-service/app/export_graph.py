"""Génère le graphe Mermaid de l'agent (figure 3.6) : python export_graph.py"""
from agent import build_agent
g = build_agent(lambda p: "", lambda q, o: [], lambda: "")
open("agent_graph.mmd", "w").write(g.get_graph().draw_mermaid())
print(g.get_graph().draw_mermaid())