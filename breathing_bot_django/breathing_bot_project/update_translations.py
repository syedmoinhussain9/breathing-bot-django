import polib
import os
from translations import translations


def update_po_files():
    locale_dir = 'locale'

    for msgid, lang_map in translations.items():
        for lang_code, translation in lang_map.items():
            # Ensure the path matches your actual directory structure
            po_path = os.path.join(locale_dir, lang_code, 'LC_MESSAGES', 'django.po')

            if os.path.exists(po_path):
                po = polib.pofile(po_path)
                entry = po.find(msgid)

                if entry:
                    entry.msgstr = translation
                else:
                    new_entry = polib.POEntry(msgid=msgid, msgstr=translation)
                    po.append(new_entry)

                po.save()
                print(f"Updated {lang_code}: {msgid}")
            else:
                print(f"Skipping: {po_path} not found.")


if __name__ == "__main__":
    update_po_files()
