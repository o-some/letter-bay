# Letter Bay – V2 Parity Contract

Dieser Vertrag schützt die funktionierende Legacy-Spielmechanik während der V2-Entwicklung.

## Pflichtfunktionen

- [ ] Boss-Intro
- [ ] Bosskampf starten Boss 1
- [ ] Bosskampf starten Boss 2+
- [ ] A–Z/Ä/Ö/Ü
- [ ] Einzelbuchstaben
- [ ] richtige Buchstaben werden eingesetzt
- [ ] falsche Buchstaben kosten Tula HP
- [ ] Ganzwort-Lösung
- [ ] Boss HP 3/3
- [ ] Tula HP 7/7
- [ ] Hinweis
- [ ] Muschel-Joker
- [ ] Sterne/Punkte
- [ ] Muscheln
- [ ] Wort-Sieg
- [ ] Niederlage
- [ ] Motivationsdialog
- [ ] Weiterlernen
- [ ] Bosswechsel
- [ ] 10 Bossnamen
- [ ] 10 korrekte Bossgrafiken
- [ ] Bossgrafik Intro
- [ ] Bossgrafik Arena
- [ ] Bossgrafiken Route
- [ ] positive Rückmeldungen
- [ ] kontrollierte Scrollposition
- [ ] kein wachsender Leerraum
- [ ] mobile HP-/Tastatur-Erreichbarkeit

## Änderungsregel

Eine Legacy-Funktion darf nur ersetzt werden nach:

```text
Legacy vorhanden
→ V2 implementiert
→ statischer Test
→ Unit/Integration
→ E2E
→ iPhone-Safari-Prüfung
→ erst danach Legacy deaktivieren
```

Bis dahin bleibt `?engine=legacy` als sicherer Fallback vorgesehen.
