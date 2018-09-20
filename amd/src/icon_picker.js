// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/* eslint space-before-function-paren: 0 */

/**
 * Javascript Module to handle the icon picker dialogue for format_tiles
 * which the editing user uses to select an icon for a tile or the default icon
 * for all tiles in the course
 *
 * @module      icon_picker
 * @package     course/format
 * @subpackage  tiles
 * @copyright   2018 David Watson
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since       Moodle 3.3
 */

define(["jquery", "core/templates", "core/ajax", "core/str", "core/notification"],
        function ($, Templates, ajax, str, Notification) {
    "use strict";
    return {
        init: function (courseId, pageType) {
            var selectBox;
            var setIcon = function (sectionId, sectionNum, icon, selectBox) {
                var ajaxIconPickArgs = {
                    icon: icon,
                    courseid: courseId,
                    sectionid: sectionId
                    // Sectionid will be zero if relates to whole course not just one sec
                };
                var setIconDbPromises = ajax.call([{
                    methodname: "format_tiles_set_icon",
                    args: ajaxIconPickArgs
                }]);
                setIconDbPromises[0].done(function (response) {
                    if (response === true) {
                        if (pageType === "course-view-tiles") {
                            // We are changing an icon for a specific section
                            // from within the course by clicking an existing icon
                            var iconToChange = $("#tileicon_" + sectionNum).find(".icon");
                            iconToChange.animate({opacity: 0}, 500, function () {
                                Templates.render("format_tiles/tileicon", {
                                    tileicon: icon,
                                    tileid: sectionNum,
                                    secid: sectionId
                                }).done(function (html) {
                                    iconToChange.fadeOut(0).replaceWith($(html).find(".icon"))
                                        .animate({opacity: 1}, 500);
                                });
                            });
                        } else if (pageType === "course-edit" || pageType === "course-editsection") {
                            // We are changing the icon using a drop down menu not the icon picker modal,
                            // either for the whole course or for one section
                            // select new icon in drop down
                            selectBox.val(icon);
                            // Then change the image shown next to it
                            Templates.renderPix("tileicon/" + icon, "format_tiles")
                                .done(function (newIcon) {
                                    $("#selectedicon").html(newIcon);
                                    if (pageType === "course-editsection") {
                                        str.get_strings([
                                            {key: "tip", component: "format_tiles"},
                                            {key: "tileselecttip", component: "format_tiles"}
                                        ]).done(function (strings) {
                                            Notification.alert(
                                                strings[0],
                                                strings[1]
                                            );
                                        });
                                    }
                                });
                        }
                    }
                }).fail(Notification.exception);
            };
            /**
             * When user clicks to launch an icon picker modal, set which section it relates to
             * so that we know which section the icon clicked is for.  This is so that only one modal needs
             * to be rendered (with all the icons in it) - we can use it to assign icons to any section
             */
            var watchLaunchButtons = function () {
                $(".launchiconpicker").click(function (e) {
                    var clickedIcon = $(e.currentTarget);
                    console.log('click');
                    console.log(e.currentTarget);
                    require(["core/modal_factory"], function (modalFact) {
                        str.get_string("pickicon", "format_tiles")
                            .done(function (pickAnIcon) {
                                modalFact.create({
                                    type: modalFact.types.DEFAULT,
                                    title: pickAnIcon,
                                    body: $("#iconpickermodalbody").html()
                                }).done(function (modal) {
                                    modal.setLarge();
                                    modal.show();
                                    var modalRoot = $(modal.root);
                                    modalRoot.attr("id", "icon_picker_modal_" + clickedIcon.attr("data-section"));
                                    modalRoot.attr("data-sectionid", clickedIcon.attr("data-section"));
                                    modalRoot.addClass("icon_picker_modal");
                                    modalRoot.on("click", ".pickericon", function (e) {
                                        console.log('click2');
                                        console.log(e.currentTarget);
                                        setIcon(
                                            clickedIcon.attr("data-sectionid"),
                                            clickedIcon.attr("data-section"),
                                            $(e.currentTarget).attr("data-icon"),
                                            selectBox
                                        );
                                        modal.hide();
                                    });
                                });
                            });
                    });
                });
            };

            $(document).ready(function () {
                console.log('ready');
                if (pageType === "course-edit") {
                    selectBox = $("#id_defaulttileicon");
                } else if (pageType === "course-editsection") {
                    selectBox = $("#id_tileicon");
                }

                /**
                 * If we are on the course edit settings form, render a button to be added to
                 * it, next to the existing drop down select box for course default tile icon
                 * and add it to the page
                 */
                if (pageType === "course-edit" || pageType === "course-editsection") {
                    Templates.render("format_tiles/icon_picker_launch_btn", {
                        initialicon: selectBox.val()
                    }).done(function (html) {
                        $(html).insertAfter(selectBox);
                        watchLaunchButtons();
                    });
                } else {
                    watchLaunchButtons();
                }
            });
        }
    };
});