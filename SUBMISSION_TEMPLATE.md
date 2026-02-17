# Submission: Aleksandra Wilk

## Time Spent

Total time: 4.5h (approximate)

## Ticket Triage

### Tickets I Addressed

List the ticket numbers you worked on, in the order you addressed them:

1. **CFG-142**: Price shows wrong value after rapid option changes – naprawiłam race condition przy asynchronicznym pobieraniu ceny (porównywanie niepasujących identyfikatorów requestów).

### Tickets I Deprioritized

List tickets you intentionally skipped and why:

| Ticket  | Reason                                                                                   |
| ------- | ---------------------------------------------------------------------------------------- |
| CFG-143 | Skupiłam się na CFG-142 jako blocking; memory/performance wymaga dłuższego profilowania. |
| CFG-144 | Konflikt z CFG-145 (usunąć vs ulepszyć Quick Add) – czekam na decyzję produktu.          |
| CFG-145 | Jak wyżej.                                                                               |
| CFG-146 | Niski priorytet (kosmetyka timezone).                                                    |
| CFG-147 | Trudne do odtworzenia bez konkretnego linku od customera.                                |
| CFG-148 | Nie zdążyłam w tej iteracji.                                                             |

### Tickets That Need Clarification

List any tickets where you couldn't proceed due to ambiguity:

| Ticket            | Question                                                                   |
| ----------------- | -------------------------------------------------------------------------- |
| CFG-144 / CFG-145 | Quick Add: usunąć (144) czy dodać skrót (145)? Potrzebna decyzja produktu. |

---

## Technical Write-Up

### Critical Issues Found

Describe the most important bugs you identified:

#### Issue 1: Race condition – cena „cofa się” przy szybkiej zmianie opcji

**Ticket(s):** CFG-142

**What was the bug?**

Przy szybkiej zmianie kilku opcji (np. rozmiar → kolor → materiał) wysyłane było kilka requestów do `calculatePrice`. Odpowiedzi wracały w losowej kolejności (ze względu na `randomDelay` 100–600 ms). Hook aktualizował stan (`setPrice`, `setFormattedTotal`) na podstawie warunku, który **nie działał poprawnie**: porównywał `response.timestamp` z API z wartością po stronie klienta. W oryginale API zwracało wewnętrzny licznik (1, 2, 3…), a w hooku używane było np. `Date.now()` albo inna skala – więc porównanie było błędne (np. zawsze false albo akceptowanie złej odpowiedzi). W efekcie starsza odpowiedź mogła nadpisać nowszą i na ekranie pokazywała się cena dla wcześniejszego wyboru (np. Medium zamiast XL).

**How did you find it?**

1. Odtworzyłam błąd: uruchomiłam aplikację, szybko zmieniałam rozmiar/kolor kilka razy i patrzyłam na Total Price – czasem cena „cofała się”.
2. W DevTools → Network zobaczyłam, że przy szybkich zmianach leci kilka requestów i odpowiedzi wracają w różnej kolejności.
3. Przeszukałam kod po „Total Price” / `formattedTotal` → znalazłam `ProductConfigurator.tsx` i hook `usePriceCalculation`.
4. W hooku znalazłam wywołanie `calculatePrice` i warunek przed `setPrice`/`setFormattedTotal` (coś w stylu sprawdzenia `response.timestamp`).
5. W `api.ts` sprawdziłam, co zwraca `calculatePrice`: pole `timestamp` (np. wewnętrzny `requestId` 1, 2, 3…).
6. Porównałam to z tym, co hook ustawia jako „najnowszy request” (ref) – wyszło, że **skale się nie zgadzają** (małe liczby z API vs duże z `Date.now()` albo odwrotna logika). Dodałam tymczasowo `console.log` w hooku przy starcie requestu i przy odpowiedzi, żeby zobaczyć wartości `response.timestamp` i ref – potwierdziło się, że warunek nie odrzucał starych odpowiedzi albo nigdy nie był spełniony.

**How did you fix it?**

- W **hooku** (`usePriceCalculation.ts`): dodałam `requestIdRef` (licznik 0, 1, 2…). Na początku każdego `fetchPrice` robię `const myRequestId = ++requestIdRef.current` i przekazuję `myRequestId` do `calculatePrice(config, product, myRequestId)`. Stan aktualizuję **tylko gdy** `response.timestamp === myRequestId`. W bloku `catch` ustawiam błąd tylko gdy `requestIdRef.current === myRequestId`.
- W **API** (`api.ts`): dodałam opcjonalny argument `clientRequestId?: number` do `calculatePrice` i w zwracanym obiekcie ustawiam `timestamp: clientRequestId ?? requestId`, żeby hook dostał z powrotem ten sam id, który wysłał, i mógł go porównać.

Dzięki temu tylko odpowiedź dla **aktualnego** requestu (ten sam id) aktualizuje cenę; starsze odpowiedzi są ignorowane.

**Why this approach?**

Rozważałam debounce (opóźnienie wywołań), ale to by tylko maskowało problem i opóźniało pokazanie ceny. Poprawne rozwiązanie to jawne oznaczanie requestu po stronie klienta i porównywanie „czy ta odpowiedź jest do mojego ostatniego wywołania” – to standardowy wzorzec przy race conditions z async API.

---

### Other Changes Made

Brief description of any other modifications:

- Brak innych zmian – skupiłam się wyłącznie na CFG-142 (hook + API). `ProductConfigurator.tsx` nie wymagał zmian w logice wyświetlania.

---

## Code Quality Notes

### Things I Noticed But Didn't Fix

List any issues you noticed but intentionally left:

| Issue                                                                                                                      | Why I Left It                                                                    |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `useDebouncedPriceCalculation` w tym samym pliku nie używa `clientRequestId` i nadal może mieć race przy szybkich zmianach | Poza scope CFG-142; gdyby był używany w configuratorze, warto by go ujednolicić. |
| Komentarz w API „Track request IDs for debugging (and to create the race condition bug)”                                   | Zostawiłam – dokumentuje historię.                                               |
| Import w hooku: `from "../components/ProductConfigurator/types"` (hook jest w `src/hooks/`)                                | Działa; ewentualna refaktoryzacja ścieżek na później.                            |

### Potential Improvements for the Future

If you had more time, what would you improve?

1. Dodać ten sam mechanizm `clientRequestId` do `useDebouncedPriceCalculation`, jeśli jest używany.
2. Prosty test E2E lub unit: „szybko zmień opcje 5 razy, sprawdź że wyświetlana cena odpowiada ostatniej konfiguracji”.
3. Ujednolicić lokalizację hooka (hooks vs ProductConfigurator) i ścieżki importów.

---

## Questions for the Team

Questions you would ask in a real scenario:

1. Quick Add: finalna decyzja – usuwamy (CFG-144) czy zostawiamy i dodajemy skrót (CFG-145)?
2. Czy `useDebouncedPriceCalculation` jest gdzieś używany? Jeśli tak, czy mam go zabezpieczyć tym samym mechanizmem co `usePriceCalculation`?
3. Czy TechStyle demo ma konkretne scenariusze (np. lista opcji do szybkiego testu), które powinnam zweryfikować po fixie?

---

## Assumptions Made

List any assumptions you made to proceed:

1. „Wrong value” w ticketcie = wyświetlana cena nie pasuje do aktualnej konfiguracji (np. cena za poprzedni wybór) – nie błąd samego algorytmu liczenia.
2. Naprawa ma być po stronie frontu (hook + mock API); backend w tym zadaniu nie istnieje / nie jest w scope.
3. Zachowanie przy pojedynczej, spokojnej zmianie opcji ma zostać takie samo (brak regresji).

---

## Self-Assessment

### What went well?

Odtworzenie błędu z opisu ticketu było proste. Śledzenie od UI (gdzie jest cena) → hook → API pozwoliło szybko zawęzić problem do jednego miejsca (warunek przy aktualizacji stanu i niezgodność identyfikatorów). Sprawdzenie w Network i tymczasowe logi potwierdziły diagnozę.

### What was challenging?

Na początku nie byłam pewna, czy problem jest w kolejności requestów, w cache, czy w samym liczeniu – musiałam przejść krok po kroku od „co widać na ekranie” do „skąd to się bierze” i dopiero wtedy wpadłam na porównanie `timestamp` vs ref.

### What would you do differently with more time?

Dodałabym test (np. w Vitest) symulujący kilka równoległych odpowiedzi z różnymi `timestamp` i sprawdzający, że stan aktualizuje się tylko dla najnowszego requestId. Przydałby się też krótki komentarz w hooku przy `requestIdRef` / przy warunku `response.timestamp === myRequestId`, żeby następna osoba od razu wiedziała, po co to jest.

---

## Additional Notes

Anything else you want us to know:

Fix jest minimalny (hook + sygnatura i zwracane pole w `calculatePrice`). Nie zmieniałem komponentu wizualnego ani innych ticketów. Jeśli używacie gdzieś `useDebouncedPriceCalculation`, warto go zabezpieczyć tym samym wzorcem.
