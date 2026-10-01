import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements for T.dark / T.light
    # Backgrounds
    content = content.replace("bg-[#0a0a0a]", "${t.bg}")
    content = content.replace("bg-[#1a1a1a]", "${t.bgPanel}")
    content = content.replace("bg-[#111111]", "${t.bgPanel}")
    
    # Text
    content = re.sub(r'text-white(?!/)', '${t.textPrimary}', content)
    content = content.replace("text-white/70", "${t.textSecondary}")
    content = content.replace("text-white/60", "${t.textSecondary}")
    content = content.replace("text-white/50", "${t.textMuted}")
    content = content.replace("text-white/40", "${t.textMuted}")
    content = content.replace("text-white/30", "${t.textFaint}")
    content = content.replace("text-white/25", "${t.textFaint}")
    content = content.replace("text-white/20", "${t.textFaint}")
    
    # Borders
    content = content.replace("border-white/10", "${t.border}")
    content = content.replace("border-white/[0.06]", "${t.border}")
    content = content.replace("border-white/[0.07]", "${t.borderCard}")
    
    # BGs
    content = content.replace("bg-white/[0.02]", "${t.bgCard}")
    content = content.replace("bg-white/[0.04]", "${t.bgInput}")
    content = content.replace("bg-white/5", "${t.bgInput}")
    
    # Hovers
    content = content.replace("hover:bg-white/5", "${t.sectionHover}")
    content = content.replace("hover:bg-white/[0.04]", "${t.sectionHover}")
    content = content.replace("hover:bg-white/10", "${t.ctxHover}")
    
    # Convert string literals to template literals where ${t.} is used
    # E.g. className="w-full ${t.bg} ..." -> className={`w-full ${t.bg} ...`}
    def fix_classname(match):
        inner = match.group(1)
        if '${t.' in inner:
            return f'className={{`{inner}`}}'
        return match.group(0)
    
    content = re.sub(r'className="([^"]*)"', fix_classname, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('src/pages/Dashboard.jsx')
process_file('src/components/ui/dashboard-sidebar.jsx')
