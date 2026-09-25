"""Tests for upgrade-check.py. Run with: python3 test/scripts/test_upgrade_check.py"""
import importlib.util
import os
import unittest

_spec = importlib.util.spec_from_file_location(
    "upgrade_check", os.path.join(os.path.dirname(__file__), "..", "..",
                                  "src", "scripts", "upgrade-check.py"))
uc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(uc)


def inheritance_issues(html):
    builder = uc.TreeBuilder()
    builder.feed(html)
    issues = []
    uc.check_inheritance(builder.root, "t.html", issues)
    return [(i.line, i.message.split(" ")[0]) for i in issues]


class InheritanceOverrideTest(unittest.TestCase):

    def test_descendant_overriding_attr_is_not_flagged(self):
        # https://github.com/bigskysoftware/htmx/issues/4001
        html = ('<i hx-get="foo" hx-target="bar">\n'
                '  <b hx-get="bar" hx-target="qux">\n'
                '</i>\n')
        self.assertEqual(inheritance_issues(html), [])

    def test_grandchild_below_override_is_not_flagged(self):
        html = ('<div hx-target="#a">\n'
                '  <span hx-target="#b"><em hx-get="/x"></em></span>\n'
                '</div>\n')
        # the <span> itself still needs :inherited for the <em>; the outer
        # <div> does not, since the <em> never sees its hx-target
        self.assertEqual(inheritance_issues(html), [(2, "hx-target")])

    def test_inherited_override_counts_as_override(self):
        html = ('<div hx-target="#a">\n'
                '  <button hx-get="/x" hx-target:inherited="#b"></button>\n'
                '</div>\n')
        self.assertEqual(inheritance_issues(html), [])

    def test_sibling_without_override_still_flagged(self):
        html = ('<div hx-target="#c">\n'
                '  <span hx-target="#d"></span>\n'
                '  <button hx-get="/y"></button>\n'
                '</div>\n')
        self.assertEqual(inheritance_issues(html), [(1, "hx-target")])

    def test_merged_attrs_still_flagged_despite_child_value(self):
        # htmx 2 merged hx-vals and hx-headers from ancestors, so a child's
        # own value does not make the ancestor's value moot
        html = ('<div hx-vals=\'{"a":1}\'>\n'
                '  <button hx-get="/z" hx-vals=\'{"b":2}\'></button>\n'
                '</div>\n'
                '<div hx-headers=\'{"a":1}\'>\n'
                '  <button hx-post="/z" hx-headers=\'{"b":2}\'></button>\n'
                '</div>\n')
        flagged = inheritance_issues(html)
        self.assertIn((1, "hx-vals"), flagged)
        self.assertIn((4, "hx-headers"), flagged)

    def test_boost_opt_out_on_descendant_is_not_flagged(self):
        html = ('<div hx-boost="true">\n'
                '  <a hx-boost="false" href="/x"></a>\n'
                '</div>\n')
        self.assertEqual(inheritance_issues(html), [])

    def test_boost_still_flagged_for_other_links(self):
        html = ('<div hx-boost="true">\n'
                '  <a hx-boost="false" href="/x"></a>\n'
                '  <a href="/y"></a>\n'
                '</div>\n')
        self.assertEqual(inheritance_issues(html), [(1, "hx-boost")])


if __name__ == "__main__":
    unittest.main()
